import fs from 'fs/promises'
import { MessageReceived } from '../interface'
import ValidationError from '../modules/validation.error'
import { downloadMediaMessage } from '@whiskeysockets/baileys'

/**
 * Save Media
 */
const saveMedia = async (path: string, data: Buffer) => {
  await fs.writeFile(path, data.toString('base64'), 'base64')
}

/**
 * Save Image Handler
 */
export const saveImageHandler = async (msg: MessageReceived, path: string) => {
  if (!msg.message?.imageMessage)
    throw new ValidationError('Message is not contain Image')

  const buf = await downloadMediaMessage(msg, 'buffer', {})

  return saveMedia(path, buf as Buffer)
}

/**
 * Save Video Handler
 * @param msg
 * @param path
 * @returns
 */
export const saveVideoHandler = async (msg: MessageReceived, path: string) => {
  if (!msg.message?.videoMessage)
    throw new ValidationError('Message is not contain Video')

  const buf = await downloadMediaMessage(msg, 'buffer', {})

  return saveMedia(path, buf as Buffer)
}

/**
 * Save Document Handler
 * @param msg
 * @param path
 * @returns
 */
export const saveDocumentHandler = async (
  msg: MessageReceived,
  path: string
) => {
  if (!msg.message?.documentMessage)
    throw new ValidationError('Message is not contain Document')

  const buf = await downloadMediaMessage(msg, 'buffer', {})

  const ext = msg.message.documentMessage.fileName?.split('.').pop()
  path += '.' + ext

  return saveMedia(path, buf as Buffer)
}
