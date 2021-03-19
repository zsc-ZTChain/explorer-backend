import PromiseRouter from 'express-promise-router'
import {UncleService} from '../services/uncle'

const router = PromiseRouter()
/**
 * @swagger
 * /uncle/{key}/detail:
 *   get:
 *     summary: 获取叔块详情
 *     description: params use number | hash
 *     tags:
 *      - Uncle
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
 *         description: 获取叔块详情
 *         schema:
 *          type: object
 *          properties:
 *             uncle:
 *               type: object
 *               $ref: '#/definitions/uncle'
 */
router.get('/:key/detail', async (req, res) => {
  const uncle = await UncleService.getUncleByParamter(req.params.key)
  res.json(uncle)
})

/**
 * @swagger
 * /uncle/page:
 *   get:
 *     summary: 叔块列表
 *     tags:
 *      - Uncle
 *     produces:
 *      - application/json
 *     parameters:
 *      - $ref: '#/parameters/pageSize'
 *      - $ref: '#/parameters/pageNumber'
 *     responses:
 *       200:
 *         description: 获取叔块详情
 *         schema:
 *          type: object
 *          properties:
 *             uncles:
 *               type: array
 *               description: 叔块列表
 *               items:
 *                 type: object
 *                 $ref: '#/definitions/uncle'
 *             count:
 *               type: number
 *               description: 叔块总数
 */
router.get('/page', async (req, res) => {
  const pageSize: number = req.query.pageSize
  const pageNumber: number = req.query.pageNumber
  const uncles = await UncleService.getListByPage(pageSize, pageNumber)
  res.json(uncles)
})

/**
 * @swagger
 * /uncle/block/{number}:
 *   get:
 *     summary: 获取当前区块内的叔块列表
 *     tags:
 *      - Uncle
 *     produces:
 *      - application/json
 *     parameters:
 *      - $ref: '#/parameters/pageSize'
 *      - $ref: '#/parameters/pageNumber'
 *      - $ref: '#/parameters/number'
 *     responses:
 *       200:
 *         schema:
 *          type: object
 *          properties:
 *             uncles:
 *               type: array
 *               description: 叔块列表
 *               items:
 *                 type: object
 *                 $ref: '#/definitions/uncle'
 *             count:
 *               type: number
 *               description: 叔块总数
 */
router.get('/block/:number', async (req, res) => {
  const blockNumber = Number(req.params.number)
  const pageSize: number = req.query.pageSize
  const pageNumber: number = req.query.pageNumber
  const uncles = await UncleService.getListByBlockNumber(blockNumber, pageSize, pageNumber)
  res.json(uncles)
})
module.exports = router
