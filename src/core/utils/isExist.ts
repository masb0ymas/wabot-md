import { getSession } from '~/socket'
import { SendMessageTypes } from '../interface'
import { WhatsappError } from '../modules/wa.error'
import { phoneToJid } from './phoneToJid'

/**
 *
 * @param params
 * @returns
 */
export const isExist = async ({
  sessionId,
  to,
  isGroup = false,
}: SendMessageTypes): Promise<boolean> => {
  try {
    const session = getSession(sessionId)

    if (!session) throw new WhatsappError('Session ID Not Found!')

    const receiver = phoneToJid({ to: to, isGroup: isGroup })

    if (!isGroup) {
      const existsWA = await session.onWhatsApp(receiver)
      const result = Boolean(existsWA?.[0]?.exists)

      console.log(existsWA, result)
      return result
    } else {
      return Boolean((await session.groupMetadata(receiver)).id)
    }
  } catch (error) {
    throw error
  }
}
