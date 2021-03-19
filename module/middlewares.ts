import {createLogger, stdSerializers} from 'bunyan'
import {NextFunction, Request, Response} from 'express'
import {validationResult} from 'express-validator'
import * as os from 'os'
import * as loggerConfig from './logger'

const Logger = createLogger({
  ...loggerConfig('middleware'),
  serializers: stdSerializers,
} as any)

declare global {
  // eslint-disable-next-line
  namespace Express {
    // eslint-disable-next-line
    interface Request {
      logger: typeof Logger
      id: string
    }
    // eslint-disable-next-line
    interface Response {
      logger: typeof Logger
      missing(field: string | string[]): this
    }
  }
}

export interface IServicedRequest<T> extends Request {
  service: T
}

const HOSTNAME = os.hostname()

export function centerMiddleware(req: Request, res: Response, next: NextFunction) {
  res.missing = (field: string | string[]) => {
    return res.status(400)
      .json({
        message: `missing ${field.toString()}`,
      })
  }
  req.logger = Logger.child({req, res, reqId: req.id})
  res.logger = req.logger
  res.set('x-req-node', HOSTNAME)

  next()
}

export function checkValidationResult(req: Request, res: Response, next: NextFunction) {
  const validation = validationResult(req)
  if (!validation.isEmpty()) {
    return res.status(400)
      .json({
        message: 'invalid arguments',
        errors: validation.mapped(),
      })
  }
  next()
}
