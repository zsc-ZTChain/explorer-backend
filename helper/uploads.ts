import * as Multer from 'multer'
import * as path from 'path'
import {Request} from 'express'
import * as fs from 'fs-extra'

// ../public/uploads/'
const dir = path.resolve(__dirname, '../public/uploads')
export const upload = Multer({
  storage: Multer.diskStorage({
    destination: async (req: Request, file, cb) => {
      await mkdirUpload(`${dir}/${req.body.address}`)
      cb(null, `${dir}/${req.body.address}`)
    },
    filename: async (req, file, cb) => {
      const changedName = file.originalname
      cb(null, changedName)
    },
  }),
})

async function mkdirUpload(dir) {
  const isExist = await fs.pathExists(dir)
  if (!isExist) {
    await fs.ensureDir(dir)
  }
}
