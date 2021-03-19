import PromiseRouter from 'express-promise-router'
import {EventService} from '../services/event'

const router = PromiseRouter()
/**
 * @swagger
 * /event/list:
 *   get:
 *     summary: 当前合约事件列表
 *     tags:
 *      - Event
 *     produces:
 *      - application/json
 *     parameters:
 *      - $ref: '#/parameters/pageSize'
 *      - $ref: '#/parameters/pageNumber'
 *      - $ref: '#/parameters/address'
 *      - $ref: '#/parameters/event'
 *      - $ref: '#/parameters/transactionHash'
 *     responses:
 *       200:
 *         description: 合约列表
 *         schema:
 *          type: object
 *          properties:
 *             events:
 *               type: array
 *               description: 事件列表
 *               items:
 *                 type: object
 *             count:
 *               type: number
 *             callError:
 *               $ref: '#/responses/40003'
 *
 */
router.get('/list', async (req, res) => {
  const events = await EventService.getEventsByAddress(req.query)
  res.json(events)
})

/**
 * @swagger
 * definitions:
 *   eventMethodCallParam:
 *     required:
 *       - address
 *       - methodName
 *       - params
 *     properties:
 *       address:
 *         type: string
 *         description: 当前合约地址
 *       methodName:
 *         type: string
 *         description: 调用方法名
 *       params:
 *         type: array
 *         description: 方法参数 "ex:[2,3,4,5]"
 */

/**
 * @swagger
 * /event/method/call:
 *   post:
 *     summary: 调用合约方法
 *     tags:
 *      - Event
 *     produces:
 *      - application/json
 *     parameters:
 *       - name: eventMethodCallParam
 *         description: event Method Call
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/eventMethodCallParam'
 *     responses:
 *       200:
 *         description: 合约详情
 *         schema:
 *          type: object
 *          properties:
 *             events:
 *               type: object
 *               $ref: '#/definitions/contract'
 *             callError:
 *               $ref: '#/responses/40001'
 */
router.post('/method/call', async (req, res) => {
  const {address, methodName, params} = req.body

  const events = await EventService.sendEventsByAddress(address, methodName, params)

  res.json(events)
})

module.exports = router
