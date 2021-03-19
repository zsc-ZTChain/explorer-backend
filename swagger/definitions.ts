/**
 * @swagger
 * definitions:
 *   verifyParam:
 *     required:
 *       - address
 *       - sourceCode
 *     properties:
 *       address:
 *         type: string
 *         description: 合约地址
 *       libraries:
 *         type: string
 *         description: "{'TestLib':'0xd5ced6a2d2261dc92fb78d8ddbf186a2f6bbc701'}"
 *       optimizer:
 *         type: string
 *         description: 优化 "{enabled:boolean,runs:number= 200}"
 *       sourceCode:
 *         type: string
 *         description: 合约源码
 *   multerVerifyParam:
 *     required:
 *       - address
 *       - multerFile
 *     properties:
 *       address:
 *         type: string
 *         description: 合约地址
 *       libraries:
 *         type: string
 *         description: "{'TestLib':'0xd5ced6a2d2261dc92fb78d8ddbf186a2f6bbc701'}"
 *       optimizer:
 *         type: string
 *         description: 优化 "{enabled:boolean,runs:number= 200}"
 *       multerFile:
 *         type: string
 *         description: 上传文件
 */

/**
 * @swagger
 * definitions:
 *   block:
 *     properties:
 *       number:
 *         type: number
 *       difficulty:
 *         type: number
 *       extraData:
 *         type: string
 *       gasLimit:
 *         type: string
 *       gasUsed:
 *         type: string
 *       hash:
 *         type: string
 *       logsBloom:
 *         type: string
 *       miner:
 *         type: string
 *       mixHash:
 *         type: string
 *       nonce:
 *         type: string
 *       parentHash:
 *         type: string
 *       receiptsRoot:
 *         type: string
 *       sha3Uncles:
 *         type: string
 *       unclesCount:
 *         type: string
 *       uncleInclusionRewards:
 *         type: string
 *       txnFees:
 *         type: string
 *       minerReward:
 *         type: string
 *       foundation:
 *         type: number
 *       size:
 *         type: number
 *       stateRoot:
 *         type: string
 *       transactionsRoot:
 *         type: number
 *       timestamp:
 *         type: number
 *       totalDifficulty:
 *         type: number
 */

/**
 * @swagger
 * definitions:
 *   uncle:
 *     properties:
 *       blockNumber:
 *         type: number
 *       number:
 *         type: number
 *       difficulty:
 *         type: number
 *       extraData:
 *         type: string
 *       gasLimit:
 *         type: string
 *       gasUsed:
 *         type: string
 *       hash:
 *         type: string
 *       logsBloom:
 *         type: string
 *       miner:
 *         type: string
 *       mixHash:
 *         type: string
 *       nonce:
 *         type: string
 *       parentHash:
 *         type: string
 *       receiptsRoot:
 *         type: string
 *       sha3Uncles:
 *         type: string
 *       size:
 *         type: number
 *       stateRoot:
 *         type: string
 *       transactionsRoot:
 *         type: number
 *       timestamp:
 *         type: number
 *       reward:
 *         type: number
 *       uncleIndex:
 *         type: number
 */

/**
 * @swagger
 * definitions:
 *   transaction:
 *     properties:
 *       blockHash:
 *         type: string
 *       blockNumber:
 *         type: string
 *       from:
 *         type: string
 *       to:
 *         type: string
 *       gas:
 *         type: string
 *       gasUsed:
 *         type: string
 *       hash:
 *         type: string
 *       gasPrice:
 *         type: number
 *       input:
 *         type: string
 *       nonce:
 *         type: string
 *       transactionIndex:
 *         type: number
 *       value:
 *         type: number
 *       status:
 *         type: number
 *       timestamp:
 *         type: number
 */

/**
 * @swagger
 * definitions:
 *   contract:
 *     properties:
 *       hash:
 *         type: string
 *       cumulativeGasUsed:
 *         type: number
 *       address:
 *         type: string
 *       contractName:
 *         type: string
 *       compiler:
 *         type: string
 *       version:
 *         type: string
 *       verifiedStatus:
 *         type: number
 *       verifiedTime:
 *         type: number
 *       sourceCode:
 *         type: string
 *       abi:
 *         type: string
 *       arg:
 *         type: string
 *       value:
 *         type: number
 *       txns:
 *         type: number
 *       from:
 *         type: string
 *       sourceMap:
 *         type: string
 *       swarmSource:
 *         type: string
 *       optimizer:
 *         type: string
 *       uid:
 *         type: number
 */

/**
 * @swagger
 * definitions:
 *   cross:
 *     properties:
 *       event:
 *         type: string
 *       transactionHash:
 *         type: string
 *       remoteChainId:
 *         type: number
 *         description: 子链Id
 *       from:
 *         type: string
 *       blockNumber:
 *         type: number
 *       to:
 *         type: string
 *       value:
 *         type: string
 *       destValue:
 *         type: string
 *       data:
 *         type: string
 *       timestamp:
 *         type: number
 *       chainId:
 *         type: number
 *         description: 主链Id
 *       isRevoked:
 *         type: boolean
 *         description: 是否撤单
 */
