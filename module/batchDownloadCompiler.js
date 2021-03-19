import * as path from "path";
import {createLogger, stdSerializers} from 'bunyan'
import * as loggerConfig from './logger'

const {downloadFile} = require("../utils/downloadCompiler")
const fse = require("fs-extra")
const https = require('https')
const requireFromString = require('require-from-string');
const MemoryStream = require('memorystream');
const dir = path.resolve(__dirname, '../public/compilers')
const axios = require('axios')
const url = 'https://solc-bin.ethereum.org/bin/list.js'

const Logger = createLogger({
  ...loggerConfig('TimeTask'),
  serializers: stdSerializers,
})
async function downloadVersions(version) {
  if (!await fse.pathExists(`${dir}/${version}`)) {
    const data = await new Promise((resolve, rejects) => {
      downloadFile(version, (err, cb) => {
        if (err) {
          rejects(err)
        } else {
          resolve(cb)
        }
      })
    })
    if (!data) {
      Logger.error( 'disconnect', {message: `can not download ${version}`})
    }else{
      Logger.info( 'success', {message: `save compiler - ${version} success`})
    }
  }
}

async function getListFromEth() {
  Logger.info( 'success', {message: `正在下载文件到 - ${dir}`})
  const mem = new MemoryStream(null, {readable: false});
  https.get(url, async (response) => {
    if (response.statusCode !== 200) {
      Logger.error( 'disconnect', {message: `not found ${url}`})
    } else {
      response.pipe(mem);
      response.on('end', async () => {
        const result = requireFromString(mem.toString())
        const files = Object.values(result.releases)
        for (const item of files) {
          const name = item.substring(8, item.length - 3)
          await downloadVersions(name)
        }
      });
    }
  }).on('error', function (error) {
    Logger.error( 'disconnect', {message: `not download from ${url}`, error})
  });
}

async function fetchVersionFromEth() {
  const result =  await axios.get(url).catch(e => {
    Logger.error( 'disconnect', {message: e.message})
  })
  const list = requireFromString(result.data)
  return Object.values(list.releases)
}
module.exports = {getListFromEth, fetchVersionFromEth}
