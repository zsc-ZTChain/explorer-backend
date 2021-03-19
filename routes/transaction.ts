import PromiseRouter from 'express-promise-router'
import {TransactionService} from '../services/transaction'
import {EventService} from '../services/event'
import {ContractService} from '../services/contract'
import * as web3 from '../lib/web3'
import {createHttpError} from '../error/errors'
import {TransactionModel} from '../model/transaction'
import * as Bluebird from 'bluebird'
import {dbPool, redis} from '../lib/db'

const router = PromiseRouter()

/**
 * @swagger
 * /transaction/{hash}/detail:
 *   get:
 *     summary: 获取交易详情
 *     tags:
 *      - Transaction
 *     produces:
 *      - application/json
 *     parameters:
 *      - $ref: '#/parameters/hash'
 *     responses:
 *       200:
 *         description: 交易详情
 *         schema:
 *          type: object
 *          properties:
 *             transaction:
 *               type: object
 *               $ref: '#/definitions/transaction'
 *             events:
 *               type: array
 *               description: 关联的事件
 *               items:
 *                 type: object
 *             detailError:
 *               $ref: '#/responses/50001'
 */
router.get('/:hash/detail', async (req, res) => {
  const [blockNumber, transaction] = await Bluebird.all([
    web3.eth.getBlockNumber(),
    TransactionService.getTransByHash(req.params.hash),
  ])
  let contract = await ContractService.getByHash(transaction.hash)
  transaction['contractAddress'] = contract ? contract.address : null
  if (transaction.to) {
    const isContract =  await ContractService.isContractAddress(transaction.to)
    if (isContract) {
      contract = await ContractService.getByAddress(transaction.to)
    }
  }

  try {
    switch (true) {
      case transaction.to && contract && contract.verifiedStatus === 1: {
        const ContractEvents = await EventService.getEventsByAddress({
          address: contract.address,
          event: 'allEvents',
          transactionHash: transaction.hash,
        })
        res.json({transaction, events: ContractEvents, blockNumber})
      }
        break
      default:
        res.json({transaction, blockNumber})
    }
  } catch (e) {
    if (e.message.startsWith('Provided address')) {
      throw createHttpError({status: 200, message: 'address is not exist', code: 20001}, {...e})
    } else {
      throw e
    }
  }
})

/**
 * @swagger
 * /transaction/page:
 *   get:
 *     summary: 交易列表
 *     tags:
 *      - Transaction
 *     produces:
 *      - application/json
 *     parameters:
 *      - $ref: '#/parameters/pageSize'
 *      - $ref: '#/parameters/pageNumber'
 *     responses:
 *       200:
 *         description: 交易详情
 *         schema:
 *          type: object
 *          properties:
 *             transactions:
 *               type: array
 *               description: 交易列表
 *               items:
 *                 type: object
 *                 $ref: '#/definitions/transaction'
 *             count:
 *               type: number
 */
router.get('/page', async (req, res) => {
  const pageSize: number = req.query.pageSize
  const pageNumber: number = req.query.pageNumber
  const trans = await TransactionService.getListByPage(pageSize, pageNumber)
  res.json(trans)
})

/**
 * @swagger
 * /transaction/block/{number}:
 *   get:
 *     summary: 获取当前区块内的交易列表
 *     tags:
 *      - Transaction
 *     produces:
 *      - application/json
 *     parameters:
 *      - $ref: '#/parameters/pageSize'
 *      - $ref: '#/parameters/pageNumber'
 *      - $ref: '#/parameters/number'
 *     responses:
 *       200:
 *         description: 交易详情
 *         schema:
 *          type: object
 *          properties:
 *             transactions:
 *               type: array
 *               description: 交易列表
 *               items:
 *                 type: object
 *                 $ref: '#/definitions/transaction'
 *             count:
 *               type: number
 */
router.get('/block/:number', async (req, res) => {
  const blockNumber = Number(req.params.number)
  const pageSize: number = req.query.pageSize
  const pageNumber: number = req.query.pageNumber
  const trans = await TransactionService.getTransByBlockNumber(blockNumber, pageSize, pageNumber)
  res.json(trans)
})

/**
 * @swagger
 * /transaction/totalCount:
 *   get:
 *     summary: 获取当前所有交易数量
 *     tags:
 *      - Transaction
 *     produces:
 *      - application/json
 *     responses:
 *       200:
 *         description: 交易详情
 *         schema:
 *          type: object
 *          properties:
 *             totalCount:
 *               type: number
 *               description: 交易总数
 *             hashRate:
 *               type: number
 *               description: 每秒钟哈希值算出数量
 *             totalContractFee:
 *               type: number
 *               description: 所有合约消耗的手续费总和
 */
router.get('/totalCount', async (req, res) => {
  const totalCount = await TransactionModel.count()
  const highNumber = await web3.eth.getBlockNumber()
  const timesKey = await redis.keys('explorer:hashRate:time:*')
  const highBlock = await web3.eth.getBlock(highNumber)
  let avgTime = 12
  if (timesKey.length > 0) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    const mTime = await redis.mget(timesKey)
    avgTime = Number(
      (mTime.reduce((accumulator, currentValue) => accumulator + Number(currentValue), 0) / mTime.length)
        .toFixed(6)
    )
  }
  const hashRate = Number(highBlock.difficulty) / avgTime
  const [totalContractFee, totalTransFee] = await Bluebird.all([
    ContractService.getTotalContractFee(),
    TransactionService.getTotalTransFee(),
  ])
  res.json({totalCount, hashRate, totalContractFee, totalTransFee})
})

/**
 * @swagger
 * /transaction/tx/{hash}:
 *   get:
 *     summary: 获取交易详情(提供给app)
 *     tags:
 *      - Transaction
 *     produces:
 *      - application/json
 *     parameters:
 *      - $ref: '#/parameters/hash'
 *     responses:
 *       200:
 *         description: 交易详情
 *         schema:
 *          type: object
 *          properties:
 *             transaction:
 *               type: object
 *               $ref: '#/definitions/transaction'
 *             blockNumber:
 *               type: number
 */
router.get('/tx/:hash', async (req, res) => {
  const blockNumber = await web3.eth.getBlockNumber()
  const transactions = await dbPool.query(`
     select * from transactions where cast(hash as CHAR)=?
    `, {
    replacements: [req.params.hash],
    type: 'SELECT',
  })

  const transaction = transactions[0]

  const blocks = await dbPool.query(`
            select * from blocks where number=? 
        `, {
    replacements: [transaction.blockNumber],
    type: 'SELECT',
  })

  transaction.block = blocks[0]

  res.json({transaction, blockNumber})
})

module.exports = router
