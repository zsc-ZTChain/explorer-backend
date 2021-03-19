import {dbPool} from '../lib/db'
import {INTEGER, Model, TEXT} from 'sequelize'
export enum EnumCrossEvent {
  EVENT_MARKE = 'MakerTx',
  EVENT_TAKE = 'TakerTx',
  EVENT_FINISH = 'MakerFinish'
}
export class CrossEventModel extends Model {
  id: string
  blockNumber: number
  txId: string
  event: string
  from: string
  to: string
  remoteChainId: number
  value: string
  destValue: string
  transactionHash: string
  input: string
  data: string
}

CrossEventModel.init({
  id: {
    type: 'varchar(30)',
    primaryKey: true,
  },
  blockNumber: {
    type: INTEGER,
  },
  txId: {
    type: 'varchar(66)',
  },
  event: {
    type: 'varchar(20)',
  },
  from: {
    type: 'varchar(42)',
  },
  to: {
    type: 'varchar(42)',
  },
  remoteChainId: {
    type: INTEGER,
  },
  value: {
    type: 'varchar(100)',
  },
  destValue: {
    type: 'varchar(100)',
  },
  transactionHash: {
    type: 'varchar(66)',
  },
  data: {
    type: TEXT,
  },
  input: {
    type: TEXT,
  },
}, {
  sequelize: dbPool,
  freezeTableName: true,
  timestamps: false,
  tableName: 't_cross_events',
  indexes: [
    {
      fields: ['blockNumber'],
    },
    {
      fields: ['txId'],
    },
    {
      fields: ['event'],
    },
  ],
})

