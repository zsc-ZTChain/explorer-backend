import {BIGINT, INTEGER, MEDIUMINT, Model, SMALLINT} from 'sequelize'
import {dbPool} from '../lib/db'

export class TransactionModel extends Model {
  blockHash?: number
  blockNumber?: number
  hash: string
  from?: number
  gas?: number
  gasUsed?: number
  gasPrice?: bigint
  input?: string
  nonce?: number
  to?: string
  transactionIndex?: number
  value?: string
  status?: boolean
}

TransactionModel.init(
  {
    blockHash: {
      type: 'binary(32)',
    },
    blockNumber: INTEGER,
    hash: {
      type: 'binary(32)',
      primaryKey: true,
    },
    from: {
      type: 'binary(20)',
    },
    gas: MEDIUMINT,
    gasUsed: MEDIUMINT,
    gasPrice: BIGINT,
    input: {
      type: 'varbinary(50000)',
    },
    nonce: {
      type: 'binary(8)',
    },
    to: {
      type: 'binary(20)',
    },
    transactionIndex: SMALLINT,
    value: {
      type: 'varbinary(32)',
    },
    status: {
      type: 'tinyint(1)',
    },
  }, {
    sequelize: dbPool,
    tableName: 't_transactions',
    freezeTableName: true,
    timestamps: false,
    indexes: [
      {
        fields: ['blockNumber'],
      },
      {
        fields: ['from'],
      },
      {
        fields: ['to'],
      },
      {
        fields: ['hash'],
      },
    ],
  }
)

