import {dbPool} from '../lib/db'
import {INTEGER, Model, STRING} from 'sequelize'

export class ContractChartModel extends Model {
  address: string
  name: string
  txs: number
  fee: string
  date: string
}

ContractChartModel.init(
  {
    address: {
      type: STRING(42),
      primaryKey: true,
    },
    name: STRING(200),
    txs: INTEGER({length: 11}),
    fee: STRING(100),
    date: {
      type: STRING(10),
      primaryKey: true,
    },
  }, {
    sequelize: dbPool,
    tableName: 't_contracts_chart',
    freezeTableName: true,
    timestamps: false,
    indexes: [
      {
        fields: ['date', 'address'],
      },
    ],
  }
)

