/**
 * Create Delay
 * @param duration
 * @returns
 */
export const createDelay = async (duration: number = 1000) => {
  return await new Promise((resolve) =>
    setTimeout(() => {
      resolve(true)
    }, duration)
  )
}
