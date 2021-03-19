import {dbPool} from '../lib/db'
import {BIGINT, DECIMAL, DOUBLE, Model, STRING} from 'sequelize'

export class BlockChartModel extends Model {
  date: string
  difficulty?: number
  size?: number
  blockCount: number
  avgTime: number
  txCount: number
  uncleCount: number
  avgHashrate: number
  txFee: string
}

BlockChartModel.init(
  {
    difficulty: {
      type: DOUBLE({length: 17, decimals: 0}),
    },
    size: DECIMAL(9, 0),
    blockCount: BIGINT({length: 21}),
    avgTime: DECIMAL(14, 2),
    txCount: DECIMAL(42, 0),
    uncleCount: BIGINT({length: 21}),
    avgHashrate: DOUBLE({length: 17, decimals: 0}),
    txFee: STRING(100),
    date: {
      type: STRING(10),
      primaryKey: true,
    },
  }, {
    sequelize: dbPool,
    tableName: 't_blocks_chart',
    freezeTableName: true,
    timestamps: false,
    indexes: [
      {
        fields: ['date'],
      },
    ],
  }
)

