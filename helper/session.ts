import {UserMetaModel} from '../model/userMeta'

declare global {
  //eslint-disable-next-line
  namespace Express {
    //eslint-disable-next-line
    interface Request {
      user: UserMetaModel & {uid: number}
    }
  }
}

export async function checkLogin(req, res, next) {
  if (!req.session.uid) {
    return res.json({
      message: 'need login',
      err: {
        code: 10003,
        status: 200,
      },
    })
  }
  try {
    const userMeta = await UserMetaModel.findByPk(req.session.uid, {raw: true})
    if (userMeta) {
      req.user = userMeta
      req.user.uid = userMeta.uid
    } else {
      await initUser(req, res, next)
    }
  } catch (e) {
    return next(e)
  }

  next()
}
async function initUser(req, res, next) {
  await UserMetaModel.upsert({
    uid: req.session.uid,
    email: req.session.email,
    phone: req.session.phone,
  })
  const userMeta = await UserMetaModel.findByPk(req.session.uid, {raw: true})
  req.user = userMeta
  req.user.uid = userMeta.uid
  next()
}
