/**
 * @swagger
 * parameters:
 *   pageSize:
 *       name: pageSize
 *       in: query
 *       type: integer
 *       required: false
 *       description: 当前页数据量
 *   pageNumber:
 *       name: pageNumber
 *       in: query
 *       type: integer
 *       required: false
 *       description: 页码
 *   hash:
 *       name: hash
 *       in: path
 *       type: string
 *       required: true
 *   number:
 *       name: number
 *       in: path
 *       type: string
 *       required: true
 *   address:
 *       name: address
 *       in: query
 *       type: string
 *       required: true
 *   account:
 *       name: account
 *       in: query
 *       type: string
 *       required: true
 *       description: 账户地址
 *   event:
 *       name: event
 *       in: query
 *       type: string
 *       required: false
 *       description: 事件名
 *   transactionHash:
 *       name: transactionHash
 *       in: query
 *       type: string
 *       required: false
 *       description: 交易hash
 *
 */
