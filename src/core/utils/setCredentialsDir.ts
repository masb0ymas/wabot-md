import { CREDENTIALS } from '../constants'

/**
 * Set Credentials Dir
 * @param dirname
 */
export const setCredentialsDir = (dirname: string = 'wa_credentials') => {
  CREDENTIALS.DIR_NAME = dirname
}
