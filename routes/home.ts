import PromiseRouter from 'express-promise-router'
import {TransactionService} from '../services/transaction'
import * as Bluebird from 'bluebird'
import * as web3 from '../lib/web3'
import {BlockService} from '../services/block'
import {UncleService} from '../services/uncle'
import {ContractService} from '../services/contract'
import {createHttpError} from '../error/errors'

const router = PromiseRouter()
/**
 * @swagger
 * /home/info:
 *   get:
 *     summary: 交易和区块信息
 *     tags:
 *      - Home
 *     produces:
 *      - application/json
 *     responses:
 *       200:
 *         schema:
 *          type: object
 *          properties:
 *             blocks:
 *               type: array
 *               description: 区块列表
 *               items:
 *                 type: object
 *                 $ref: '#/definitions/block'
 *             transactions:
 *               type: array
 *               description: 交易列表
 *               items:
 *                 type: object
 *                 $ref: '#/definitions/transaction'
 */
router.get('/info', async (req, res) => {
  const [transactions, blocks] = await Bluebird.all([
    TransactionService.getFistPage(),
    BlockService.getFistPage(),
  ])
  res.json({transactions, blocks})
})

/**
 * @swagger
 * /home/accountOrContact/{address}/detail:
 *   get:
 *     summary: 涉及账户或合约详情
 *     tags:
 *      - Home
 *     produces:
 *      - application/json
 *     parameters:
 *      - $ref: '#/parameters/address'
 *     responses:
 *       200:
 *         description: 交易详情
 *         schema:
 *          type: object
 *          properties:
 *             blockCount:
 *                type: number
 *                description: 当前查询账户的区块数
 *             uncleCount:
 *                type: number
 *                description: 当前查询账户的叔块数
 *             balance:
 *                type: number
 *                description: 当前查询账户余额
 *             contract:
 *                type: object
 *                description: 合约详情
 *                $ref: '#/definitions/contract'
 *             addressError:
 *                $ref: '#/responses/20001'
 */
router.get('/accountOrContact/:address/detail', async (req, res) => {
  const address = req.params.address
  const web3Balance = await web3.eth.getBalance(address)
  const balance = web3.utils.fromWei(String(web3Balance), 'ether')

  try {
    const code = await web3.eth.getCode(address)
    if (code === '0x') {
      const [blockCount, uncleCount] = await Bluebird.all([
        BlockService.getBlockCountByMiner(address),
        UncleService.getUncleCountByMiner(address),
      ])
      res.json({blockCount, uncleCount, balance})
    } else {
      const contract = await ContractService.getByAddress(address)
      res.json({contract, balance})
    }
  } catch (e) {
    if (e.message.startsWith('Provided address')) {
      throw createHttpError({status: 200, message: 'address is not exist', code: 20001}, {...e})
    } else {
      throw e
    }
  }
})


module.exports = router
