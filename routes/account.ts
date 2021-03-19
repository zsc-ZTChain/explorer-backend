import PromiseRouter from 'express-promise-router'
import {BlockService} from '../services/block'
import {UncleService} from '../services/uncle'
import * as web3 from '../lib/web3'
import {TransactionService} from '../services/transaction'
import * as Bluebird from 'bluebird'

const router = PromiseRouter()
// http://192.168.9.164:3002/swagger
/**
 * @swagger
 * /account:
 *   get:
 *     summary: 账户信息
 *     description: 搜索区块、叔块、交易、合约
 *     tags:
 *      - Account
 *     produces:
 *      - application/json
 *     parameters:
 *      - in: query
 *        name: account
 *        description: User's miner/from
 *        required: true
 *        schema:
 *          type: string
 *     responses:
 *       200:
 *         description: login
 *         schema:
 *           type: object
 *           required:
 *              - blockCount
 *              - uncleCount
 *              - balance
 *           properties:
 *             blockCount:
 *                type: number
 *                description: 当前查询账户的区块数
 *             uncleCount:
 *                type: number
 *                description: 当前查询账户的叔块数
 *             balance:
 *                type: number
 *                description: 当前查询账户余额
 */
router.get('/', async (req, res) => {
  const {account} = req.query
  const [web3Balance, blockCount, uncleCount] = await Bluebird.all([
    web3.eth.getBalance(account),
    BlockService.getBlockCountByMiner(account),
    UncleService.getUncleCountByMiner(account),
  ])
  const balance = web3.utils.fromWei(String(web3Balance), 'ether')
  res.json({blockCount, balance, uncleCount})
})

/**
 * @swagger
 * /account/blocks:
 *   get:
 *     summary: 关联区块
 *     tags:
 *      - Account
 *     produces:
 *      - application/json
 *     parameters:
 *      - $ref: '#/parameters/pageSize'
 *      - $ref: '#/parameters/pageNumber'
 *      - in: query
 *        name: account
 *        description: User's miner/from
 *        required: true
 *        schema:
 *          type: string
 *     responses:
 *       200:
 *         description: 区块详情
 *         schema:
 *           $ref: '#/definitions/block'
 */
router.get('/blocks', async (req, res) => {
  const {account, pageSize, pageNumber} = req.query
  const blocks = await BlockService.getBlocksByMiner(account, pageNumber, pageSize)
  res.json(blocks)
})

/**
 * @swagger
 * /account/uncles:
 *   get:
 *     summary: 关联叔块
 *     tags:
 *      - Account
 *     produces:
 *      - application/json
 *     parameters:
 *      - $ref: '#/parameters/pageSize'
 *      - $ref: '#/parameters/pageNumber'
 *      - in: query
 *        name: account
 *        description: User's miner/from
 *        required: true
 *        schema:
 *          type: string
 *     responses:
 *       200:
 *         description: 叔块详情
 *         schema:
 *           $ref: '#/definitions/uncle'
 */
router.get('/uncles', async (req, res) => {
  const {account, pageSize, pageNumber} = req.query
  const uncles = await UncleService.getUnclesByMiner(account, pageNumber, pageSize)
  res.json(uncles)
})

/**
 * @swagger
 * /account/transactions:
 *   get:
 *     summary: 关联交易
 *     tags:
 *      - Account
 *     produces:
 *      - application/json
 *     parameters:
 *      - $ref: '#/parameters/pageSize'
 *      - $ref: '#/parameters/pageNumber'
 *      - in: query
 *        name: account
 *        description: User's miner/from
 *        required: true
 *        schema:
 *          type: string
 *     responses:
 *       200:
 *         description: 交易详情
 *         schema:
 *           $ref: '#/definitions/transaction'
 */
router.get('/transactions', async (req, res) => {
  const {account, pageSize, pageNumber} = req.query
  const transactions = await TransactionService.getTransByFromOrTo(account, pageNumber, pageSize)
  res.json(transactions)
})

module.exports = router
