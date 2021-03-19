export function createHttpError({status, message, code, type}: {
  status: number
  message: string
  code?: number
  type?: string}, params?: object) {
  const err = new Error(message)
  Object.assign(err, {data: {...params}, status, code, type})
  Error.captureStackTrace(err, createHttpError)
  return err
}
