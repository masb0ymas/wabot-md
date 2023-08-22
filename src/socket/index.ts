import { Boom } from '@hapi/boom'
import makeWASocket, {
  Browsers,
  DisconnectReason,
  WASocket,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
} from '@whiskeysockets/baileys'
import fs from 'fs'
import path from 'path'
import { pino } from 'pino'
import { CALLBACK_KEY, CREDENTIALS } from '~/core/constants'
import { MessageReceived, StartSessionParams } from '~/core/interface'
import { Messages } from '~/core/modules/message'
import { WhatsappError } from '~/core/modules/wa.error'
import {
  saveDocumentHandler,
  saveImageHandler,
  saveVideoHandler,
} from '~/core/utils/saveMedia'

const sessions: Map<string, WASocket> = new Map()

const callback: Map<string, Function> = new Map()

const retryCount: Map<string, number> = new Map()

/**
 * Start Session
 * @param sessionId
 * @param options
 * @returns
 */
export const startSession = async (
  sessionId = 'session1',
  options: StartSessionParams = { printQR: true }
): Promise<WASocket> => {
  if (isSessionExistAndRunning(sessionId)) {
    throw new WhatsappError(Messages.sessionAlreadyExist(sessionId))
  }

  const logger = pino({ level: 'silent' })

  const { version } = await fetchLatestBaileysVersion()

  const startSocket = async () => {
    const { state, saveCreds } = await useMultiFileAuthState(
      path.resolve(CREDENTIALS.DIR_NAME, sessionId + CREDENTIALS.PREFIX)
    )

    const sock: WASocket = makeWASocket({
      version,
      printQRInTerminal: options.printQR,
      auth: state,
      logger,
      markOnlineOnConnect: false,
      browser: Browsers.ubuntu('Chrome'),
    })

    sessions.set(sessionId, { ...sock })

    try {
      sock.ev.process(async (events) => {
        if (events['connection.update']) {
          const update = events['connection.update']
          const { connection, lastDisconnect } = update

          if (update.qr) {
            callback.get(CALLBACK_KEY.ON_QR)?.({
              sessionId,
              qr: update.qr,
            })
          }

          if (connection == 'connecting') {
            callback.get(CALLBACK_KEY.ON_CONNECTING)?.(sessionId)
          }

          if (connection === 'close') {
            const code = (lastDisconnect?.error as Boom)?.output?.statusCode
            let retryAttempt = retryCount.get(sessionId) ?? 0
            let shouldRetry

            if (code != DisconnectReason.loggedOut && retryAttempt < 10) {
              shouldRetry = true
            }

            if (shouldRetry) {
              retryAttempt++
            }

            if (shouldRetry) {
              retryCount.set(sessionId, retryAttempt)
              startSocket()
            } else {
              retryCount.delete(sessionId)
              deleteSession(sessionId)
              callback.get(CALLBACK_KEY.ON_DISCONNECTED)?.(sessionId)
            }
          }

          if (connection == 'open') {
            retryCount.delete(sessionId)
            callback.get(CALLBACK_KEY.ON_CONNECTED)?.(sessionId)
          }
        }

        if (events['creds.update']) {
          await saveCreds()
        }

        if (events['messages.upsert']) {
          const msg = events['messages.upsert']
            .messages?.[0] as unknown as MessageReceived
          msg.sessionId = sessionId
          msg.saveImage = (path) => saveImageHandler(msg, path)
          msg.saveVideo = (path) => saveVideoHandler(msg, path)
          msg.saveDocument = (path) => saveDocumentHandler(msg, path)
          callback.get(CALLBACK_KEY.ON_MESSAGE_RECEIVED)?.({
            ...msg,
          })
        }
      })

      return sock
    } catch (error) {
      console.log('SOCKET ERROR', error)
      return sock
    }
  }

  return startSocket()
}

/**
 * @deprecated Use startSession method instead
 */
export const startWhatsapp = startSession

/**
 * Delete Session
 * @param sessionId
 */
export const deleteSession = async (sessionId: string) => {
  const session = getSession(sessionId)

  try {
    await session?.logout()
  } catch (error) {
    console.log(error)
  }

  session?.end(undefined)
  sessions.delete(sessionId)

  const dir = path.resolve(CREDENTIALS.DIR_NAME, sessionId + CREDENTIALS.PREFIX)

  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { force: true, recursive: true })
  }
}

/**
 * Get All Session
 * @returns
 */
export const getAllSession = (): string[] => Array.from(sessions.keys())

/**
 * Get Session
 * @param key
 * @returns
 */
export const getSession = (key: string): WASocket | undefined =>
  sessions.get(key) as WASocket

/**
 * Session Exist & Runing
 * @param sessionId
 * @returns
 */
const isSessionExistAndRunning = (sessionId: string): boolean => {
  const pathDir = path.resolve(CREDENTIALS.DIR_NAME)
  const pathDirPrefix = path.resolve(
    CREDENTIALS.DIR_NAME,
    sessionId + CREDENTIALS.PREFIX
  )

  const checkDir = fs.existsSync(pathDir)
  const checkDirPrefix = fs.existsSync(pathDirPrefix)
  const checkDirPrefixLength = fs.readdirSync(pathDirPrefix).length

  if (
    checkDir &&
    checkDirPrefix &&
    checkDirPrefixLength &&
    getSession(sessionId)
  ) {
    return true
  }

  return false
}

/**
 * Should Load Session
 * @param sessionId
 * @returns
 */
const shouldLoadSession = (sessionId: string): boolean => {
  const pathDir = path.resolve(CREDENTIALS.DIR_NAME)
  const pathDirPrefix = path.resolve(
    CREDENTIALS.DIR_NAME,
    sessionId + CREDENTIALS.PREFIX
  )

  const checkDir = fs.existsSync(pathDir)
  const checkDirPrefix = fs.existsSync(pathDirPrefix)
  const checkDirPrefixLength = fs.readdirSync(pathDirPrefix).length

  if (
    checkDir &&
    checkDirPrefix &&
    checkDirPrefixLength &&
    !getSession(sessionId)
  ) {
    return true
  }

  return false
}

/**
 * Load Session From Storage
 */
export const loadSessionsFromStorage = () => {
  if (!fs.existsSync(path.resolve(CREDENTIALS.DIR_NAME))) {
    fs.mkdirSync(path.resolve(CREDENTIALS.DIR_NAME))
  }

  fs.readdir(path.resolve(CREDENTIALS.DIR_NAME), async (err, dirs) => {
    if (err) {
      throw err
    }

    for (const dir of dirs) {
      const sessionId = dir.split('_')[0]

      if (!shouldLoadSession(sessionId)) continue
      startSession(sessionId)
    }
  })
}

/**
 * On Message Received
 * @param listener
 */
export const onMessageReceived = (listener: (msg: MessageReceived) => any) => {
  callback.set(CALLBACK_KEY.ON_MESSAGE_RECEIVED, listener)
}

/**
 * On QR Updated
 * @param listener
 */
export const onQRUpdated = (
  listener: ({ sessionId, qr }: { sessionId: string; qr: string }) => any
) => {
  callback.set(CALLBACK_KEY.ON_QR, listener)
}

/**
 * On Connected
 * @param listener
 */
export const onConnected = (listener: (sessionId: string) => any) => {
  callback.set(CALLBACK_KEY.ON_CONNECTED, listener)
}

/**
 * On Disconnected
 * @param listener
 */
export const onDisconnected = (listener: (sessionId: string) => any) => {
  callback.set(CALLBACK_KEY.ON_DISCONNECTED, listener)
}

/**
 * On Connecting
 * @param listener
 */
export const onConnecting = (listener: (sessionId: string) => any) => {
  callback.set(CALLBACK_KEY.ON_CONNECTING, listener)
}
