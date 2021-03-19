import * as bcrypt from 'bcryptjs'
import {UserRegModel} from '../model/userReg'
import {isEmail} from '../helper/functions'
import {createHttpError} from '../error/errors'
import {redis} from '../lib/db'
import * as config from 'config'
import {UserMetaModel} from '../model/userMeta'
import {sendEmail} from '../helper/nodemailer'
import * as randomString from 'random-string'

export class UserRegService {
  public static async register({account, password, verifyCode, nickname}, sessionId): Promise<UserRegModel> {
    if (await this.isUserRegistry(account)) {
      throw createHttpError({status: 200, message: 'account already be taken', code: 10001, type: 'user'})
    }
    const getCode = await this.getVerifyCode(sessionId)
    if (verifyCode !== getCode) {
      throw createHttpError({status: 200, message: 'verify code error', code: 10004, type: 'user'})
    }
    const salt = await bcrypt.genSalt()
    const hash = await bcrypt.hash(password, salt)
    const userReg = await UserRegModel.create({
      email: isEmail(account) ? account : null,
      password: hash,
    })
    await UserMetaModel.upsert({
      uid: userReg.id,
      email: userReg.email,
      phone: userReg.phone,
      nickname,
    })
    return userReg
  }

  public static async isUserRegistry(account: string): Promise<boolean> {
    return !!await UserRegModel.getByAccount(account)
  }

  public static async getVerifyCode(sessionId: string) {
    const mailerConfig = config.get('mailer.redis')
    const redisKey = `${mailerConfig.key}${sessionId}`
    return redis.get(redisKey)
  }

  public static async sendVerifyCode(account: string, sessionId: string) {
    const mailerConfig = config.get('mailer.redis')
    const code = randomString({length: 6, numeric: true, letters: false})
    const redisKey = `${mailerConfig.key}${sessionId}`
    await redis.setex(redisKey, mailerConfig.ttl, code)
    await sendEmail(account, code)
  }

  public static async isPasswordCorrect(userReg: UserRegModel, password): Promise<boolean> {
    return bcrypt.compare(password, userReg.password)
  }

  public static async login(emailOrPhone: string, password: string) {
    let user
    if (emailOrPhone.includes('@')) {
      user = await UserRegModel.getByEmail(emailOrPhone)
    } else {
      user = await UserRegModel.getByPhone(emailOrPhone)
    }
    if (!user) throw createHttpError({status: 200, message: 'no such user', code: 10003, type: 'user'})
    if (!await this.isPasswordCorrect(user, password)) {
      throw createHttpError({status: 200, message: 'wrong password', code: 10002, type: 'user'})
    }
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
    }
  }

  public static async logout(sessionId) {
    const redisConfig = config.get('redis')
    const redisKey = `${redisConfig.prefix}${sessionId}`
    await redis.del(redisKey)
  }
}
