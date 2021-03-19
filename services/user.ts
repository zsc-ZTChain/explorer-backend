import {UserRegModel} from '../model/userReg'
import {BaseUserService} from './base_user_service'
import {UserMetaModel} from '../model/userMeta'
interface ISessionInfo {
  uid: number
  email: string
  phone: string
}
export class UserService extends BaseUserService {
  public static async generateSession(userId: number): Promise<ISessionInfo>
  public static async generateSession(user): Promise<ISessionInfo> {
    if (typeof user === 'number') {
      user = await UserRegModel.findByPk(user)
    }
    return {
      uid: user.id,
      phone: user.phone,
      email: user.email,
    }
  }

  public async getUserByUid() {
    return UserMetaModel.findByPk(this.userId)
  }

  public async updateByUid(user: Partial<UserMetaModel>) {
    await UserMetaModel.update(user, {where: {uid: this.userId}})
    return this.getUserByUid()
  }
}
