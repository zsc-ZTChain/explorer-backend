import PromiseRouter from 'express-promise-router'
import {CrossService} from '../services/cross'
import  * as axios from 'axios'
import * as config from 'config'
const web3Config = config.get('web3')


const router = PromiseRouter()

/**
 * @swagger
 * /cross/getCrossList:
 *   get:
 *     summary: 跨链区块列表
 *     tags:
 *      - Cross
 *     produces:
 *      - application/json
 *     parameters:
 *      - $ref: '#/parameters/address'
 *      - $ref: '#/parameters/pageSize'
 *      - $ref: '#/parameters/pageNumber'
 *     responses:
 *       200:
 *         description: 跨链区块列表
 *         schema:
 *          type: object
 *          properties:
 *             rows:
 *               type: array
 *               $ref: '#/definitions/cross'
 *               description: 跨链区块列表
 *             count:
 *               type: number
 *               description: 跨链区块总数
 */
router.get('/getCrossList', async (req, res) => {
  const address: string = req.query.address
  const pageSize: number = req.query.pageSize
  const pageNumber: number = req.query.pageNumber
  const block = await CrossService.getCrossMakerList(address, pageSize, pageNumber)
  res.json(block)
})

/**
 * @swagger
 * /cross/{:hash}:
 *   get:
 *     summary: 获取跨链交易详情
 *     description: params use hash
 *     tags:
 *      - Cross
 *     produces:
 *      - application/json
 *     parameters:
 *      - in: path
 *        name: hash
 *        description: params use hash
 *        type: string
 *        required: true
 *     responses:
 *       200:
 *         description: 获取跨链交易详情
 *         schema:
 *          $ref: '#/definitions/cross'
 */
router.get('/:hash', async (req, res) => {
  const cross = await CrossService.getCrossDetail(req.params.hash)
  res.json(cross)
})

/**
 * @swagger
 * /cross/maker/list:
 *   get:
 *     summary: 获取跨链交易市场列表
 *     tags:
 *      - Cross
 *     produces:
 *      - application/json
 *     responses:
 *       200:
 *         description: 跨链区块交易列表
 */
router.get('/maker/list', async (req, res) => {
  const makerList = await axios.default({method: 'GET',
    url: web3Config.gethServer,
    data: {id: 1, method: 'eth_ctxContent', jsonrpc: '2.0', params: []}})
  res.json(makerList.data)
})

/**
 * @swagger
 * /cross/maker/getByAddress:
 *   get:
 *     summary: 当前账户委托列表
 *     tags:
 *      - Cross
 *     produces:
 *      - application/json
 *     parameters:
 *      - $ref: '#/parameters/address'
 *     responses:
 *       200:
 *         description: 当前账户委托列表
 */
router.get('/maker/getByAddress', async (req, res) => {
  const makerList = await axios.default({method: 'GET',
    url: web3Config.gethServer,
    data: {id: 1, method: 'eth_ctxOwner', jsonrpc: '2.0', params: [req.query.address]}})
  res.json(makerList.data)
})

/**
 * @swagger
 * /cross/maker/getByTxHash:
 *   get:
 *     summary: 查询委托订单
 *     tags:
 *      - Cross
 *     produces:
 *      - application/json
 *     parameters:
 *      - in: query
 *        name: txHash
 *        description: params use txHash
 *        type: string
 *        required: true
 *     responses:
 *       200:
 *         description: 获取委托订单详情
 */

router.get('/maker/getByTxHash', async (req, res) => {
  const detail = await CrossService.getCtxQuery(req.query.txHash)
  res.json(detail)
})
module.exports = router
