import * as Logger from 'bunyan'
import {UserMetaModel} from '../model/userMeta'

export abstract class BaseUserService {
  protected readonly userId: number
  constructor(protected user: UserMetaModel,
    protected logger: Logger,) {
    this.userId = user.uid
  }
}
