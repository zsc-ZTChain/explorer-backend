import {dbPool} from '../lib/db'
import {INTEGER, Model, STRING} from 'sequelize'
class UserMethodType extends Model {
  public static getByEmail: (email: string) => Promise<UserRegModel>
  public static getByPhone: (phone: string) => Promise<UserRegModel>
  public static getByAccount: (account: string) => Promise<UserRegModel>
}

export class UserRegModel extends UserMethodType {
  id?: number
  email: string
  phone: string
  password: string
}

UserRegModel.init({
  id: {
    type: INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  email: STRING,
  phone: STRING,
  password: STRING,
}, {
  tableName: 'userRegs',
  sequelize: dbPool,
  freezeTableName: true,
  timestamps: false,
})

UserRegModel.getByEmail = async function (email): Promise<UserRegModel> {
  return UserRegModel.findOne({where: {email}})
}

UserRegModel.getByPhone = async function (phone): Promise<UserRegModel>  {
  return  UserRegModel.findOne({where: {phone}})
}

UserRegModel.getByAccount = async function (account): Promise<UserRegModel>  {
  if (account.includes('@')) {
    return this.getByEmail(account)
  }
  return this.getByPhone(account)
}

