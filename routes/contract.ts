import PromiseRouter from 'express-promise-router'
import {ContractService} from '../services/contract'
import * as web3 from '../lib/web3'
import * as Bluebird from 'bluebird'
import {TransactionService} from '../services/transaction'
import {upload} from '../helper/uploads'
import * as fs from 'fs'
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import {fetchVersionFromEth} from '../module/batchDownloadCompiler'
//import {IServicedRequest} from '../module/middlewares'

// type Request = IServicedRequest<ContractService>

const router = PromiseRouter()

/**
 * @swagger
 * /contract/page:
 *   get:
 *     summary: 合约列表
 *     tags:
 *      - Contract
 *     produces:
 *      - application/json
 *     parameters:
 *      - $ref: '#/parameters/pageSize'
 *      - $ref: '#/parameters/pageNumber'
 *     responses:
 *       200:
 *         description: 合约列表
 *         schema:
 *          type: object
 *          properties:
 *             contracts:
 *               type: array
 *               description: 合约列表
 *               items:
 *                 type: object
 *                 $ref: '#/definitions/contract'
 *             count:
 *               type: number
 */
router.get('/page', async (req, res) => {
  const pageSize: number = req.query.pageSize
  const pageNumber: number = req.query.pageNumber
  const contracts = await ContractService.getListByPage(pageSize, pageNumber)
  res.json(contracts)
})

/**
 * @swagger
 * /contract/{address}/detail:
 *   get:
 *     summary: 获取合约详情
 *     tags:
 *      - Contract
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
 *             contract:
 *               type: object
 *               $ref: '#/definitions/contract'
 *             balance:
 *               $ref: '#/responses/50001'
 *               description: 余额
 */
router.get('/:address/detail', async (req, res) => {
  const address = req.params.address
  const [web3Balance, contract] = await Bluebird.all([
    web3.eth.getBalance(address),
    ContractService.getByAddress(address),
  ])
  if (contract.verifiedStatus === 0) {
    contract['byteCode'] = await web3.eth.getCode(contract.address)
  }
  const balance = web3.utils.fromWei(String(web3Balance), 'ether')
  res.json({contract, balance})
})

/**
 * @swagger
 * /contract/transactions:
 *   get:
 *     summary: 关联交易
 *     tags:
 *      - Contract
 *     produces:
 *      - application/json
 *     parameters:
 *      - $ref: '#/parameters/pageSize'
 *      - $ref: '#/parameters/pageNumber'
 *      - $ref: '#/parameters/address'
 *     responses:
 *       200:
 *         description: 交易列表
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
router.get('/transactions', async (req, res) => {
  const {address, pageSize, pageNumber} = req.query
  const contract = await ContractService.getByAddress(address)
  const transactions = await TransactionService.getTransByHashOrTo(contract.hash, address, pageNumber, pageSize)
  res.json(transactions)
})

// TODO: 暂时关闭登录
// router.use(checkLogin)
// router.use((req: Request, res, next) => {
//   req.service = new ContractService(req.user, req.logger)
//   next()
// })
/**
 * @swagger
 * definitions:
 *   initParam:
 *     required:
 *       - address
 *       - compiler
 *       - version
 *     properties:
 *       address:
 *         type: string
 *         description: 合约地址
 *       compiler:
 *         type: string
 *         description: 编译器
 *       version:
 *         type: string
 *         description: 编译器版本
 */
/**
 * @swagger
 * /contract/verify/init:
 *   post:
 *     summary: 合约初始验证
 *     tags:
 *      - Contract
 *     produces:
 *      - application/json
 *     parameters:
 *       - name: verifyParam
 *         description: verifyParam object
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/initParam'
 *     responses:
 *       200:
 *         description: 合约详情
 *         schema:
 *          type: object
 *          properties:
 *             contract:
 *               type: object
 *               $ref: '#/definitions/contract'
 */
router.post('/verify/init', async (req, res) => {
  // await req.service.updateInitByAddress(req.body)
  const contract = await ContractService.updateInitByAddress(req.body)
  res.json(contract)
})

/**
 * @swagger
 * /contract/upload/multer:
 *   post:
 *     summary: 多文件上传
 *     tags:
 *      - Contract
 *     produces:
 *      - application/json
 *     parameters:
 *       - name: multerVerifyParam
 *         description: multerVerifyParam object
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/multerVerifyParam'
 *     responses:
 *       200:
 *         description: 合约详情
 *         schema:
 *          type: object
 *          properties:
 *             contract:
 *               type: object
 *               $ref: '#/definitions/contract'
 *             addressError:
 *               $ref: '#/responses/20001'
 *             verifiedError:
 *               $ref: '#/responses/20003'
 *             compileError:
 *               $ref: '#/responses/30001'
 *             contractNameError:
 *               $ref: '#/responses/30002'
 *             compilerError:
 *               $ref: '#/responses/30003'
 *             dirError:
 *               $ref: '#/responses/30004'
 *             verifyError:
 *               $ref: '#/responses/30006'
 *             libraryError:
 *               $ref: '#/responses/30007'
 *             libraryMatchError:
 *               $ref: '#/responses/30008'
 *             initError:
 *               $ref: '#/responses/30011'
 *
 */
router.post('/upload/multer', upload.array('multerFile'), async (req, res) => {
  // eslint-disable-next-line prefer-const
  const {address} = req.body
  let optimizer; let libraries
  if (req.body.optimizer) {
    optimizer = JSON.parse(req.body.optimizer)
  }
  if (req.body.libraries) {
    libraries = JSON.parse(req.body.libraries)
  }
  const contract = await ContractService.updateVerifyByAddress({address}, optimizer, libraries)
  res.json(contract)
})

/**
 * @swagger
 * /contract/verify:
 *   post:
 *     summary: 合约验证
 *     tags:
 *      - Contract
 *     produces:
 *      - application/json
 *     parameters:
 *       - name: verifyParam
 *         description: multerVerifyParam object
 *         in: body
 *         schema:
 *           $ref: '#/definitions/verifyParam'
 *     responses:
 *       200:
 *         description: 合约详情
 *         schema:
 *          type: object
 *          properties:
 *             contract:
 *               type: object
 *               $ref: '#/definitions/contract'
 *             addressError:
 *               $ref: '#/responses/20001'
 *             verifiedError:
 *               $ref: '#/responses/20003'
 *             compileError:
 *               $ref: '#/responses/30001'
 *             contractNameError:
 *               $ref: '#/responses/30002'
 *             compilerError:
 *               $ref: '#/responses/30003'
 *             verifyError:
 *               $ref: '#/responses/30006'
 *             libraryError:
 *               $ref: '#/responses/30007'
 *             libraryMatchError:
 *               $ref: '#/responses/30008'
 *             initError:
 *               $ref: '#/responses/30011'
 *
 */

router.post('/verify', async (req, res) => {
  const {address, sourceCode} = req.body
  let optimizer; let libraries
  if (req.body.optimizer) {
    optimizer = JSON.parse(req.body.optimizer)
  }
  if (req.body.libraries) {
    libraries = JSON.parse(req.body.libraries)
  }
  const contract = await ContractService.updateVerifyByAddress({address, sourceCode}, optimizer, libraries)
  res.json(contract)
})

/**
 * @api {get} /contract/user/page 获取用户合约列表
 * @apiName contractUserList
 * @apiGroup Contract
 * @apiPermission Login
 * @apiVersion 1.0.0
 * @apiDescription params  pageSize and pageNumber
 *
 * @apiParam {number} [pageSize=10] 当前页数据量
 * @apiParam {number} [pageNumber=1] 页码

 * @apiSuccess (200) {Object[]} contracts 合约列表
 * @apiSuccess (200) {number} count 合约总数
 */
// router.get('/user/page', async (req: Request, res) => {
//   const pageSize: number = req.query.pageSize
//   const pageNumber: number = req.query.pageNumber
//   const contracts = await req.service.getListByUid(pageSize, pageNumber)
//   res.json(contracts)
// })

/**
 * @swagger
 * /contract/isContractAddress:
 *   post:
 *     summary: 是否为合约地址
 *     tags:
 *      - Contract
 *     produces:
 *      - application/json
 *     parameters:
 *       - name: address
 *         in: body
 *         required: true
 *         schema:
 *          required:
 *            - address
 *          properties:
 *            address:
 *              type: string
 *     responses:
 *       200:
 *         description: true or false
 */
router.post('/isContractAddress', async (req, res) => {
  const {address} = req.body
  const contract = await ContractService.isContractAddress(address)
  res.json(contract)
})


/**
 * @swagger
 * /contract/chart:
 *   post:
 *     summary: 交易手续费、合约手续费 chart data
 *     tags:
 *      - Contract
 *     produces:
 *      - application/json
 *     responses:
 *       200:
 *         description: SUCCESS
 *         schema:
 *          properties:
 *            date:
 *              description: 日期
 *            totalFee:
 *              description: 交易总消耗 gas
 *            contractFee:
 *              description: 合约消耗 gas
 */
router.post('/chart', async (req, res) => {
  const chartData = await ContractService.getTxFeeChatData()
  res.json(chartData)
})


/**
 * @swagger
 * /contract/getFeeList:
 *   post:
 *     summary: 合约消耗手续费明细
 *     tags:
 *      - Contract
 *     produces:
 *      - application/json
 *     parameters:
 *       - name: address
 *         in: body
 *         schema:
 *          properties:
 *            pageSize:
 *              type: integer
 *            pageNumber:
 *              type: integer
 *            params:
 *              type: string
 *     responses:
 *       200:
 *         description: SUCCESS
 *         schema:
 *          properties:
 *            rows:
 *              type: array
 *              items:
 *                properties:
 *                  address:
 *                    description: 合约地址
 *                  name:
 *                    description: 合约名称
 *                  fee:
 *                    description: 合约消耗手续费
 *                  txs:
 *                    description: 合约总交易数
 *            count:
 *              description: 总条数
 *              type: integer
 *
 */
router.post('/getFeeList', async (req, res) => {
  const {pageSize, pageNumber, params} = req.body
  const feeList = await ContractService.getContractFeeList(pageSize, pageNumber, params)
  res.json(feeList)
})


/**
 * @swagger
 * /contract/getFeeChartByAddress:
 *   post:
 *     summary: 按地址查询合约手续费、交易总数
 *     tags:
 *      - Contract
 *     produces:
 *      - application/json
 *     parameters:
 *       - name: address
 *         in: body
 *         schema:
 *          required:
 *            - address
 *          properties:
 *            address:
 *              type: string
 *              description: 合约地址
 *     responses:
 *       200:
 *         description: SUCCESS
 *         schema:
 *          type: array
 *          items:
 *            properties:
 *              address:
 *                description: 合约地址
 *              name:
 *                description: 合约名称
 *              txs:
 *                description: 合约交易数
 *              fee:
 *                description: 合约消耗手续费
 *              date:
 *                description: 日期
 *
 */
router.post('/getFeeChartByAddress', async (req, res) => {
  const {address} = req.body
  const feeList = await ContractService.getContractDetailByAddress(address)
  res.json(feeList)
})

/**
 * @swagger
 * /contract/compiler/versions:
 *   get:
 *     summary: 获取合约编译器版本列表
 *     tags:
 *      - Contract
 *     produces:
 *      - application/json
 *     responses:
 *       200:
 *         description: 编译器版本列表
 */
router.get('/compiler/versions', async (req, res) => {
  const readDir = fs.readdirSync('./public/compilers')
  let filenames  = readDir.filter((item) => item.length > 10)
  if (filenames.length < 10) {
    filenames = await fetchVersionFromEth()
    if (filenames) {
      filenames =  filenames.map((item) => item.substring(8, item.length - 3))
    }
  }
  res.json(filenames)
})


module.exports = router
