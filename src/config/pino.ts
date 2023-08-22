import { pino } from 'pino'

/**
 * Pino Logger
 */
export const logger = pino({
  level: 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
})
