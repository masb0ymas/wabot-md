/**
 * Abstract Message
 */
export abstract class Messages {
  static sessionAlreadyExist = (sessionId: string): string =>
    `Session ID :${sessionId} is already exist, Try another Session ID.`

  static sessionNotFound = (sessionId: string): string =>
    `Session with ID: ${sessionId} Not Exist!`

  static paremetersRequired = (props: string[] | string) =>
    `Parameter ${
      typeof props == 'string'
        ? props
        : props instanceof Array
        ? props.join(', ')
        : ''
    } is required`
}
