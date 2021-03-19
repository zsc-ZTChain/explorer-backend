import {redis} from '../lib/db'
import {BlockModel} from '../model/block'

export async function setHashRate(number, timestamp) {
  const times = await redis.keys('explorer:hashRate:time:*')
  if (times.length > 40) {
    const nums = times.map((item) => {
      return item.substring(23, item.length)
    }).sort()
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    await redis.del([`explorer:hashRate:time:${nums[0]}`])
  }
  const pre = await BlockModel.findOne({where: {number: number - 1}, attributes: ['timestamp'], raw: true})
  if (pre) {
    await redis.set(`explorer:hashRate:time:${number}`, timestamp - pre.timestamp)
  }
}
