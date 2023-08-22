import { WhatsappError } from '../modules/wa.error'

interface IPhoneToJid {
  to: string | number
  isGroup?: boolean
}

/**
 *
 * @param params
 * @returns
 */
export const phoneToJid = ({ to, isGroup = false }: IPhoneToJid): string => {
  if (!to) throw new WhatsappError('parameter "to" is required')

  let number = to.toString()

  if (isGroup) {
    number = number.replace(/\s|[+]|[-]/gim, '')
    if (!number.includes('@g.us')) number = number + '@g.us'
  } else {
    number = number.replace(/\s|[+]|[-]/gim, '')
    if (!number.includes('@s.whatsapp.net')) number = number + '@s.whatsapp.net'
  }

  return number
}
