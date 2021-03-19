import {setupMethods} from 'solc'
import * as requireFromString from 'require-from-string'
import * as  fs from 'fs'
import * as  fse from 'fs-extra'
import {createHttpError} from '../error/errors'

import * as request from 'request'
import * as path from 'path'

const dir = path.resolve(__dirname, '../public/compilers')
async function loadVersion(versionString) {
  const data = await fse.readFile(`${dir}/${versionString}`)
  return setupMethods(requireFromString(data.toString(), `soljson-${versionString}.js`))
}

export async function loadLocalVersion(version, input) {
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
      throw createHttpError({status: 200, type: 'compiler', code: 40001, message: `can not download ${version}`})
    }
  }
  const solcSnapshot = await loadVersion(version)
  return JSON.parse(solcSnapshot.compile(input))
}

export function downloadFile(versionString, callback) {
  const url = `https://ethereum.github.io/solc-bin/bin/soljson-${versionString}.js`
  const stream = fs.createWriteStream(`${dir}/${versionString}`)
  request(url).pipe(stream).on('close', () => {
    callback(null, true)
  })
}
