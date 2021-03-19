import {dbPool} from '../lib/db'
import {INTEGER, Model, STRING} from 'sequelize'
export class UserMetaModel extends Model {
  uid: number
  email: string
  phone: string
  nickname: string
  avatar: string
}

UserMetaModel.init({
  uid: {
    type: INTEGER,
    primaryKey: true,
  },
  email: STRING,
  phone: STRING,
  nickname: STRING,
  avatar: STRING(500),
}, {
  tableName: 'userMetas',
  sequelize: dbPool,
  freezeTableName: true,
  timestamps: false,
})

