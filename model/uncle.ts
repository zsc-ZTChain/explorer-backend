import {dbPool} from '../lib/db'
import {DOUBLE, INTEGER, MEDIUMINT, Model, SMALLINT} from 'sequelize'

export class UncleBlockModel extends Model {
  blockNumber: number
  number: number
  difficulty?: string
  extraData?: number
  gasLimit?: number
  gasUsed?: number
  hash: number
  logsBloom?: number
  miner?: number
  mixHash?: number
  nonce?: number
  parentHash?: number
  receiptsRoot?: number
  sha3Uncles?: number
  size?: number
  stateRoot?: number
  timestamp?: number
  transactionsRoot?: number
  uncleIndex?: number
  reward?: number
}

UncleBlockModel.init({
  blockNumber: INTEGER,
  number: INTEGER,
  difficulty: {
    type: 'varbinary(16)',
  },
  extraData: {
    type: 'binary(32)',
  },
  gasLimit: INTEGER,
  gasUsed: MEDIUMINT,
  hash: {
    type: 'binary(32)',
    primaryKey: true,
  },
  logsBloom: {
    type: 'varbinary(256)',
  },
  miner: {
    type: 'binary(20)',
  },
  mixHash: {
    type: 'binary(32)',
  },
  nonce: {
    type: 'binary(18)',
  },
  parentHash: {
    type: 'binary(32)',
  },
  receiptsRoot: {
    type: 'binary(32)',
  },
  sha3Uncles: {
    type: 'binary(32)',
  },
  size: MEDIUMINT,
  stateRoot: {
    type: 'binary(32)',
  },
  timestamp: INTEGER,
  transactionsRoot: {
    type: 'binary(32)',
  },
  uncleIndex: {
    type: SMALLINT,
  },
  reward: DOUBLE,
}, {
  tableName: 't_uncles',
  sequelize: dbPool,
  freezeTableName: true,
  timestamps: false,
  indexes: [
    {
      fields: ['number'],
    },
    {
      fields: ['hash'],
    },
    {
      fields: ['miner'],
    },
    {
      fields: ['blockNumber'],
    },
  ],
})
