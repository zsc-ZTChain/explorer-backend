import NodeRSA from 'node-rsa'
import * as fs from 'fs-extra'

// Generate new 512bit-length key
const key = new NodeRSA({b: 512})
key.setOptions({encryptionScheme: 'pkcs1'})

const privatePem = key.exportKey('pkcs1-private-pem')
const publicDer = key.exportKey('pkcs8-public-der')
const publicDerStr = publicDer.toString('base64')

// 保存返回到前端的公钥
fs.writeFile('./pem/public.pem', publicDerStr, (err) => {
  if (err) throw err
  // eslint-disable-next-line
  console.log('公钥已保存！')
})
// 保存私钥
fs.writeFile('./pem/private.pem', privatePem, (err) => {
  if (err) throw err
  // eslint-disable-next-line
  console.log('私钥已保存！')
})
