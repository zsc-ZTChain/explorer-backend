function bufferFormatter(data) {
  if (!Buffer.isBuffer(data)) return data
  return '0x'+ data.toString('hex')
}
module.exports={bufferFormatter}
