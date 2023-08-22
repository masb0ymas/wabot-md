export abstract class CREDENTIALS {
  static DIR_NAME: string = 'wa_credentials'
  static PREFIX: string = '_credentials'
}

export enum CALLBACK_KEY {
  ON_MESSAGE_RECEIVED = 'on-message-received',
  ON_QR = 'on-qr',
  ON_CONNECTED = 'on-connected',
  ON_DISCONNECTED = 'on-disconnected',
  ON_CONNECTING = 'on-connecting',
}
