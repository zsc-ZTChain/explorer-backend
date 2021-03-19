import PromiseRouter from 'express-promise-router'
import {UserRegService} from '../services/userReg'
import {UserService} from '../services/user'
import ms = require('ms')
import {IServicedRequest} from '../module/middlewares'
import {checkLogin} from '../helper/session'

type Request = IServicedRequest<UserService>

const router = PromiseRouter()

/**
 * @api {post} /user/login 登录
 * @apiName UserLogin
 * @apiGroup User
 * @apiVersion 1.0.0
 *
 * @apiParam {string} account 邮箱(手机号字段预留)，如果有@则认为是邮箱，否则认为是手机号
 * @apiParam {string} password 密码
 * @apiParam {number=0,1} isKeepLogin 是否保持登录状态（一个月有效）
 *
 * @apiSuccess (200) id 用户id
 * @apiSuccess (200) email email
 * @apiSuccess (200) phone phone
 *
 * @apiError (200 用户不存在) {Object} userError {code: 10001, message: no such user}
 * @apiError (200 密码错误) {Object} passwordError {code: 10002, message: wrong password}
 */
router.post('/login',
  async (req, res) => {
    let {account, password, isKeepLogin} = req.body

    if (!account || !password) {
      return res.missing(['account', 'password'])
    }

    account = String(account)
    password = String(password)
    isKeepLogin = isKeepLogin === 1 || isKeepLogin === '1'

    const userInfo = await UserRegService.login(account, password)
    Object.assign(req.session, await UserService.generateSession(userInfo.id))
    if (isKeepLogin) {
      req.session.cookie.maxAge = ms('30d')
    }
    res.json(userInfo)
  })

/**
 * @api {post} /user/register 注册
 * @apiName UserRegister
 * @apiGroup User
 * @apiVersion 1.0.0
 * @apiDescription
 * - 注册成功后直接获得登录态
 *
 * @apiParam {string} account 手机和邮箱二选一
 * @apiParam {string} password 密码
 * @apiParam {string} nickname 昵称
 * @apiParam {string} verifyCode 验证码
 *
 * @apiSuccess (200) id 用户id
 * @apiSuccess (200) email email
 * @apiSuccess (200) phone phone
 *
 * @apiError (200 用户名或邮箱已被注册) {Object} registerError {code: 10001, message: account already be taken}
 * @apiError (200) {Object} verifyCodeError {code: 10004, message: verify code error}
 *
 */
router.post('/register', async (req, res) => {
  const {account, password, verifyCode, nickname} = req.body
  const user = await UserRegService.register({account, password, verifyCode, nickname}, req.session.id)
  Object.assign(req.session, await UserService.generateSession(user.id))
  res.json({
    id: user.id,
    email: user.email,
    phone: user.phone,
  })
})

/**
 * @api {post} /user/verifyCode 发送验证码
 * @apiName UserSendVerifyCode
 * @apiGroup User
 * @apiVersion 1.0.0
 *
 * @apiParam {string} account 邮箱
 *
 * @apiSuccess (204) body no body
 *
 * @apiError (200 用户名或邮箱已被注册) {Object} registerError {code: 10001, message: account already be taken}
 * @apiError (200 短信还在60s冷却中){Object} registerError {code: 10001, message: message email cooldown}(还未实现)
 */

router.post('/verifyCode', async (req, res) => {
  const {account} = req.body
  try {
    await UserRegService.sendVerifyCode(account, req.session.id)
    res.sendStatus(200)
  } catch (e) {
    res.sendStatus(400)
    res.json({
      message: e.message,
    })
  }
})

/**
 * @api {get} /user/logout 登出
 * @apiName UserLogout
 * @apiGroup User
 * @apiVersion 1.0.0
 *
 * @apiSuccess (200) body nobody
 */
router.get('/logout', async (req, res) => {
  if (req.session.uid) {
    await UserRegService.logout(req.session.id)
    //eslint-disable-next-line
    // @ts-ignore
    req.session.destroy()
    res.sendStatus(200)
  } else {
    res.sendStatus(400)
  }
})


router.use(checkLogin)
router.use((req: Request, res, next) => {
  req.service = new UserService(req.user, req.logger)
  next()
})

/**
 * @api {get} /user/detail 获取用户详情
 * @apiName userInfo
 * @apiGroup User
 * @apiPermission Login
 * @apiVersion 1.0.0
 *
 * @apiSuccess (200) {Object} user 用户详情
 */
router.get('/detail', async (req: Request, res) => {
  const user = await req.service.getUserByUid()
  res.json(user)
})

/**
 * @api {post} /user/profile 更新用户信息
 * @apiName userPutProfile
 * @apiGroup User
 * @apiPermission Login
 * @apiVersion 1.0.0
 *
 * @apiParam {object} [user] 需要更新的User对象 ex：{email: '123@123.com', phone: 2343}
 * @apiSuccess (200) {Object} user 用户详情
 */
router.post('/profile', async (req: Request, res) => {
  const user = await req.service.updateByUid(req.body)
  res.json(user)
})
module.exports = router
