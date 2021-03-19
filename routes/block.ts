import PromiseRouter from 'express-promise-router'
import {BlockService} from '../services/block'
import * as web3 from '../lib/web3'

const router = PromiseRouter()

/**
 * @swagger
 * /block/{key}/detail:
 *   get:
 *     summary: 获取区块详情
 *     description: params use number | hash
 *     tags:
 *      - Block
 *     produces:
 *      - application/json
 *     parameters:
 *      - in: path
 *        name: key
 *        description: params use number | hash
 *        type: number | string
 *        required: true
 *     responses:
 *       200:
 *         description: 获取区块详情
 *         schema:
 *          type: object
 *          properties:
 *             block:
 *               type: object
 *               $ref: '#/definitions/block'
 *             uncles:
 *               type: array
 *               items:
 *                 type: object
 *                 $ref: '#/definitions/uncle'
 *             uncleReward:
 *               type: number
 *               description: 当前叔块奖励
 */
router.get('/:key/detail', async (req, res) => {
  const block = await BlockService.getblockbyParamter(req.params.key)
  res.json(block)
})

/**
 * @swagger
 * /block/page:
 *   get:
 *     summary: 区块列表
 *     tags:
 *      - Block
 *     produces:
 *      - application/json
 *     parameters:
 *      - $ref: '#/parameters/pageSize'
 *      - $ref: '#/parameters/pageNumber'
 *     responses:
 *       200:
 *         description: 获取区块详情
 *         schema:
 *          type: object
 *          properties:
 *             blocks:
 *               type: array
 *               description: 区块列表
 *               items:
 *                 type: object
 *                 $ref: '#/definitions/block'
 *             count:
 *               type: number
 *               description: 区块总数
 */
router.get('/page', async (req, res) => {
  const pageSize: number = req.query.pageSize
  const pageNumber: number = req.query.pageNumber
  const block = await BlockService.getListByPage(pageSize, pageNumber)
  res.json(block)
})

/**
 * @swagger
 * /block/:
 *   get:
 *     summary: 最新区块详情
 *     description: 提供给app
 *     tags:
 *      - Block
 *     produces:
 *      - application/json
 *     responses:
 *       200:
 *         description: 区块详情
 *         schema:
 *           $ref: '#/definitions/block'
 */
router.get('/', async (req, res) => {
  const blockNumber = await web3.eth.getBlockNumber()
  const block = await web3.eth.getBlock(blockNumber, false)
  res.json(block)
})


/**
 * @api {get} /block/chart
 * @apiName chart data list
 * @apiGroup Block
 * @apiPermission none
 * @apiVersion 1.0.0
 * @apiDescription 统计图形数据接口
 *
 * @apiSuccess (200) {Object[]} date list 数据列表
 */

/**
 * @swagger
 * /block/chart:
 *   get:
 *     summary: 统计图形数据接口
 *     tags:
 *      - Block
 *     produces:
 *      - application/json
 *     responses:
 *       200:
 *         description: 获取区块详情
 *         schema:
 *          type: object
 *          properties:
 *             blocks:
 *               type: array
 *               description: 区块列表
 *               items:
 *                 type: object
 *                 $ref: '#/definitions/block'
 *             count:
 *               type: number
 *               description: 区块总数
 */
router.get('/chart', async (req, res) => {
  const chartData = await BlockService.getChartData()
  res.json(chartData)
})


module.exports = router
