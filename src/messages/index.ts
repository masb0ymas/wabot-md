import { proto } from '@whiskeysockets/baileys'
import mime from 'mime'
import {
  SendMediaTypes,
  SendMessageTypes,
  SendReadTypes,
  SendTypingTypes,
} from '~/core/interface'
import { Messages } from '~/core/modules/message'
import { WhatsappError } from '~/core/modules/wa.error'
import { createDelay } from '~/core/utils/createDelay'
import { isExist } from '~/core/utils/isExist'
import { phoneToJid } from '~/core/utils/phoneToJid'
import { getSession } from '~/socket'

/**
 * Send Text Message
 */
export const sendTextMessage = async ({
  sessionId,
  to,
  text = '',
  isGroup = false,
  ...props
}: SendMessageTypes): Promise<proto.WebMessageInfo | undefined> => {
  const session = getSession(sessionId)

  if (!session) throw new WhatsappError(Messages.sessionNotFound(sessionId))

  // const oldPhone = to
  to = phoneToJid({ to, isGroup })

  // const isRegistered = await isExist({ sessionId, to, isGroup })

  // if (!isRegistered) {
  //   throw new WhatsappError(`${oldPhone} is not registered on Whatsapp`)
  // }

  const result = await session.sendMessage(
    to,
    { text: text },
    { quoted: props.answering }
  )

  return result
}

/**
 * Is Group
 * @param jid
 * @returns
 */
export const isGroup = (jid: string) => {
  if (jid.includes('@g.us')) return true
  return false
}

/**
 *
 * @param params
 * @returns
 */
export const sendImage = async ({
  sessionId,
  to,
  text = '',
  isGroup = false,
  media,
  ...props
}: SendMediaTypes): Promise<proto.WebMessageInfo | undefined> => {
  const session = getSession(sessionId)

  if (!session) throw new WhatsappError(Messages.sessionNotFound(sessionId))

  const oldPhone = to
  to = phoneToJid({ to, isGroup })

  const isRegistered = await isExist({ sessionId, to, isGroup })

  if (!isRegistered) {
    throw new WhatsappError(`${oldPhone} is not registered on Whatsapp`)
  }

  if (!media) {
    throw new WhatsappError('parameter media must be Buffer or String URL')
  }

  const result = await session.sendMessage(
    to,
    {
      image: typeof media == 'string' ? { url: media } : media,
      caption: text,
    },
    { quoted: props.answering }
  )

  return result
}

/**
 * Send Video
 * @param params
 * @returns
 */
export const sendVideo = async ({
  sessionId,
  to,
  text = '',
  isGroup = false,
  media,
  ...props
}: SendMediaTypes): Promise<proto.WebMessageInfo | undefined> => {
  const session = getSession(sessionId)

  if (!session) throw new WhatsappError(Messages.sessionNotFound(sessionId))

  const oldPhone = to
  to = phoneToJid({ to, isGroup })

  const isRegistered = await isExist({ sessionId, to, isGroup })

  if (!isRegistered) {
    throw new WhatsappError(`${oldPhone} is not registered on Whatsapp`)
  }

  if (!media) {
    throw new WhatsappError('parameter media must be Buffer or String URL')
  }

  const result = await session.sendMessage(
    to,
    {
      video: typeof media == 'string' ? { url: media } : media,
      caption: text,
    },
    { quoted: props.answering }
  )

  return result
}

/**
 * Send Document
 * @param params
 * @returns
 */
export const sendDocument = async ({
  sessionId,
  to,
  text = '',
  isGroup = false,
  media,
  filename,
  ...props
}: SendMediaTypes & {
  media: Buffer
  filename: string
}): Promise<proto.WebMessageInfo | undefined> => {
  const session = getSession(sessionId)

  if (!session) throw new WhatsappError(Messages.sessionNotFound(sessionId))

  const oldPhone = to
  to = phoneToJid({ to, isGroup })

  const isRegistered = await isExist({ sessionId, to, isGroup })

  if (!isRegistered) {
    throw new WhatsappError(`${oldPhone} is not registered on Whatsapp`)
  }

  if (!media || !Buffer.isBuffer(media)) {
    throw new WhatsappError(`Media File must be Buffer`)
  }

  const mimetype = mime.getType(filename)
  if (!mimetype) {
    throw new WhatsappError(`Filename must include valid extension`)
  }

  const result = await session.sendMessage(
    to,
    {
      fileName: filename,
      document: media,
      mimetype: mimetype,
      caption: text,
    },
    { quoted: props.answering }
  )

  return result
}

/**
 * Give typing effect to target
 *
 * Looks like human typing
 *
 *
 * @param sessionId - Session ID
 * @param to - Target
 * @param duration - Duration in miliseconds typing effect will appear
 */
export const sendTyping = async ({
  sessionId,
  to,
  duration = 1000,
  isGroup = false,
}: SendTypingTypes) => {
  const oldPhone = to
  to = phoneToJid({ to, isGroup })

  const session = getSession(sessionId)

  if (!session) throw new WhatsappError(Messages.sessionNotFound(sessionId))

  const isRegistered = await isExist({ sessionId, to, isGroup })

  if (!isRegistered) {
    throw new WhatsappError(`${oldPhone} is not registered on Whatsapp`)
  }

  await session.sendPresenceUpdate('composing', to)

  await createDelay(duration)

  await session.sendPresenceUpdate('available', to)
}

/**
 * Give typing effect to target
 *
 * Looks like human typing
 *
 *
 * @param sessionId - Session ID
 * @param to - Target
 * @param duration - Duration in miliseconds typing effect will appear
 */
export const readMessage = async ({ sessionId, key }: SendReadTypes) => {
  const session = getSession(sessionId)

  if (!session) throw new WhatsappError(Messages.sessionNotFound(sessionId))

  await session.readMessages([key])
}
