import { TransactionModel } from "../model/transaction";
import { bufferFormatter } from "../utils/bufferformatter";
import { txPriceFormatter } from "../utils/txPriceFormatter";
import { valueFormatter } from "../utils/valueFormatter";
import { dbPool } from "../lib/db";
import { BlockModel } from "../model/block";
import * as Bluebird from "bluebird";
import * as web3 from "../lib/web3";
import { createHttpError } from "../error/errors";
import { scientToNum } from "../utils/scientToNum";
import { Op } from "sequelize";

export class TransactionService {
  public static async getFistPage(): Promise<TransactionModel[]> {
    // 查询当前块往前200个块的前十笔交易,排除历史块
    const nowBlock = await web3.eth.getBlockNumber();
    const transParams: Record<string, any> = {
      order: [["blockNumber", "DESC"]],
      where: {
        blockNumber: {
          [Op.gt]: nowBlock - 200,
        },
      },
      offset: 0,
      limit: 10,
      raw: true,
      logging: true,
    };
    const data = await TransactionModel.findAll(transParams);
    const transactions = [];
    // TODO: slow query 版本空闲时重新考虑timestamp策略
    for (const item of data) {
      const block = await BlockModel.findOne({
        where: { number: item.blockNumber },
        attributes: ["timestamp"],
        raw: true,
      });
      if (block) {
        item["timestamp"] = block.timestamp;
      }
      transactions.push(this.transFormatter(item));
    }
    return transactions;
  }

  public static async getListByPage(pageSize = 10, pageNumber = 1) {
    const transParam: Record<string, any> = {
      order: [["blockNumber", "DESC"]],
      offset: Number((pageNumber - 1) * pageSize),
      limit: Number(pageSize),
      raw: true,
    };
    const [data, count] = await Bluebird.all([
      TransactionModel.findAll(transParam),
      TransactionModel.count(),
    ]);
    const transactions = [];
    for (const item of data) {
      const block = await BlockModel.findOne({
        where: { number: item.blockNumber },
        attributes: ["timestamp"],
        raw: true,
      });
      if (block) {
        item["timestamp"] = block.timestamp;
      }
      transactions.push(this.transFormatter(item));
    }
    return { transactions, count };
  }

  public static async getTransAllByBlockNumber(
    blockNumber
  ): Promise<TransactionModel[]> {
    const data = await TransactionModel.findAll({
      where: { blockNumber },
      raw: true,
    });
    return data.map((item) => {
      return this.transFormatter(item);
    });
  }

  public static async getTransByBlockNumber(
    blockNumber: number,
    pageSize = 10,
    pageNumber = 1
  ): Promise<{ transactions: any[]; count: number }> {
    const transParam: Record<string, any> = {
      where: { blockNumber },
      offset: Number((pageNumber - 1) * pageSize),
      limit: Number(pageSize),
      raw: true,
    };
    const result = await TransactionModel.findAll(transParam);
    const count = await TransactionModel.count({ where: { blockNumber } });

    const transactions = await Bluebird.all(
      result.map(async (item) => {
        const block = await BlockModel.findOne({
          where: { number: item.blockNumber },
          raw: true,
        });
        if (block) {
          item["timestamp"] = block.timestamp;
        }
        return this.transFormatter(item);
      })
    );

    return { transactions, count };
  }

  public static async getTransByHash(hash): Promise<TransactionModel> {
    const result = await dbPool.query(
      `
      select * from t_transactions 
      where hash = ${Buffer.from(hash).toString("binary")}
    `,
      {
        replacements: [],
        type: "SELECT",
      }
    );
    if (result.length === 0) {
      throw createHttpError({
        status: 200,
        message: "this hash not found",
        type: "transaction",
        code: 50001,
      });
    }
    const transaction: TransactionModel = result[0];
    const [block, currentBlockNumber] = await Bluebird.all([
      BlockModel.findOne({
        where: { number: transaction.blockNumber },
        attributes: ["timestamp"],
        raw: true,
      }),
      web3.eth.getBlockNumber(),
    ]);
    if (block) {
      transaction["timestamp"] = block.timestamp;
      transaction["confirmations"] =
        currentBlockNumber - transaction.blockNumber;
    }
    return this.transFormatter(transaction);
  }

  public static async getByHashFormatter(hash): Promise<TransactionModel> {
    const result = await dbPool.query(
      `
      select * from t_transactions 
      where hash = ${Buffer.from(hash).toString("binary")}
    `,
      {
        replacements: [],
        type: "SELECT",
      }
    );
    const trans: TransactionModel = result[0];
    const block = await BlockModel.findOne({
      where: { number: trans.blockNumber },
      attributes: ["timestamp"],
      raw: true,
    });
    if (block) {
      trans["timestamp"] = block.timestamp;
    }
    return this.transFormatter(trans);
  }

  public static async getByHash(hash): Promise<TransactionModel> {
    const result = await dbPool.query(
      `
      select * from t_transactions 
      where hash = ${Buffer.from(hash).toString("binary")}
    `,
      {
        replacements: [],
        type: "SELECT",
      }
    );
    if (result.length === 0) {
      return result[0];
    }
    return this.transFormatter(result[0]);
  }

  public static async getTransByFromOrTo(
    account: string,
    pageNumber = 1,
    pageSize = 10
  ): Promise<{ transactions: TransactionModel[]; count: number }> {
    const offset = (pageNumber - 1) * pageSize;
    const data = await dbPool.query(
      `
        select * from t_transactions 
        where \`from\` = ${Buffer.from(account).toString("binary")}
        or \`to\` =  ${Buffer.from(account).toString("binary")}
        order by blockNumber desc limit ? , ?
      `,
      {
        replacements: [Number(offset), Number(pageSize)],
        type: "SELECT",
      }
    );
    const transactions = [];
    for (const item of data) {
      const block = await BlockModel.findOne({
        where: { number: item.blockNumber },
        attributes: ["timestamp"],
        raw: true,
      });
      if (block) {
        item["timestamp"] = block.timestamp;
      }
      transactions.push(this.transFormatter(item));
    }
    const count = await this.getTransCountByFromOrTo(account);
    return { transactions, count };
  }

  public static async getTransCountByFromOrTo(
    account: string
  ): Promise<number> {
    const counts = await dbPool.query(
      `
        select count(1) count from t_transactions 
        where \`from\` = ${Buffer.from(account).toString("binary")}
        or \`to\` =  ${Buffer.from(account).toString("binary")}
      `,
      {
        replacements: [],
        type: "SELECT",
      }
    );
    return counts[0].count;
  }

  public static async getTransByHashOrTo(
    hash: string,
    address: string,
    pageNumber = 1,
    pageSize = 10
  ): Promise<{ transactions: TransactionModel[] | any[]; count: number }> {
    const offset = (pageNumber - 1) * pageSize;
    const result = await dbPool.query(
      `
        select * from t_transactions 
        where hash = ${Buffer.from(hash).toString("binary")}
        or \`to\` =  ${Buffer.from(address).toString("binary")}
        order by blockNumber desc limit ? , ?
      `,
      {
        replacements: [Number(offset), Number(pageSize)],
        type: "SELECT",
      }
    );

    const transactions = await Bluebird.all(
      result.map(async (item) => {
        const block = await BlockModel.findOne({
          where: { number: item.blockNumber },
          attributes: ["timestamp"],
          raw: true,
        });
        if (block) {
          item["timestamp"] = block.timestamp;
        }
        return this.transFormatter(item);
      })
    );
    const count = await this.getTransCountByHashOrTo(hash, address);
    return { transactions, count };
  }

  public static async getTransCountByHashOrTo(
    hash: string,
    address: string
  ): Promise<number> {
    const counts = await dbPool.query(
      `
        select count(1) count from t_transactions 
        where hash = ${Buffer.from(hash).toString("binary")}
        or \`to\` =  ${Buffer.from(address).toString("binary")}
      `,
      {
        replacements: [],
        type: "SELECT",
      }
    );
    return counts[0].count;
  }

  public static async getTotalTransFee() {
    const result = await dbPool.query(
      "select sum(txFee) total from t_blocks_chart",
      {
        replacements: [],
        type: "SELECT",
      }
    );
    return scientToNum(result[0].total);
  }

  public static transFormatter(item) {
    return {
      ...item,
      hash: bufferFormatter(item.hash),
      blockHash: bufferFormatter(item.blockHash),
      from: bufferFormatter(item.from),
      input: bufferFormatter(item.input),
      nonce: String(item.nonce).replace(/\0/g, ""),
      to: bufferFormatter(item.to),
      value: valueFormatter(item.value),
      status: bufferFormatter(item.status),
      fee: txPriceFormatter(item.gasUsed, item.gasPrice),
    };
  }
}
