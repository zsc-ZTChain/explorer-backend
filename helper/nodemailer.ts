import * as nodemailer from 'nodemailer'
import * as config from 'config'
const mailerConfig = config.get('mailer')

export async function sendEmail(to, code) {
  const transporter = nodemailer.createTransport(mailerConfig.init)
  await transporter.sendMail(
    {
      from: mailerConfig.sendMail.from,
      to,
      subject: mailerConfig.sendMail.subject,
      html: `test 我是测试 正文 ${code}`,
    }
  )
}
