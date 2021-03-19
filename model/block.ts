import {dbPool} from '../lib/db'
import {BIGINT, DOUBLE, INTEGER, MEDIUMINT, Model, SMALLINT} from 'sequelize'

export class BlockModel extends Model {
  number: number
  difficulty?: string | number
  extraData?: string
  gasLimit?: number
  gasUsed?: number
  hash: string
  logsBloom?: string
  miner?: string
  mixHash?: number
  nonce?: string
  parentHash?: string
  receiptsRoot?: number
  sha3Uncles?: string
  unclesCount?: number
  uncleInclusionRewards?: number
  txnFees?: number
  minerReward?: number
  foundation?: number
  size?: number
  stateRoot?: string
  timestamp?: number
  totalDifficulty?: number
  transactionsRoot?: number
}

BlockModel.init({
  number: {
    type: INTEGER,
    primaryKey: true,
  },
  difficulty: {
    type: 'varbinary(16)',
  },
  extraData: {
    type: 'varbinary(5000)',
  },
  gasLimit: BIGINT,
  gasUsed: BIGINT,
  hash: {
    type: 'binary(32)',
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
    type: 'binary(8)',
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
  unclesCount: {
    type: SMALLINT,
  },
  uncleInclusionRewards: {
    type: DOUBLE,
  },
  txnFees: {
    type: DOUBLE,
  },
  minerReward: {
    type: DOUBLE,
  },
  foundation: {
    type: DOUBLE,
  },
  size: MEDIUMINT,
  stateRoot: {
    type: 'binary(32)',
  },
  timestamp: INTEGER,
  totalDifficulty: {
    type: 'varbinary(22)',
  },
  transactionsRoot: {
    type: 'binary(32)',
  },
}, {
  sequelize: dbPool,
  freezeTableName: true,
  timestamps: false,
  tableName: 't_blocks',
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
  ],
})

