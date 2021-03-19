import PromiseRouter from 'express-promise-router'
import * as swaggerJSDoc from 'swagger-jsdoc'
import * as definition from '../swagger/swaggerInit'

const router = PromiseRouter()
/**
 * @swagger
 * /swagger:
 *   get:
 *     description: Returns swagger.json
 *     tags:
 *      - Swagger
 *     produces:
 *      - application/json
 *     responses:
 *       200:
 *         description: swagger
 */
router.get('/swagger', async (req, res) => {
  const options = {
    swaggerDefinition: definition,
    apis: ['routes/*.ts'],
  }
  const swaggerSpec = swaggerJSDoc(options)
  res.send(swaggerSpec)
})

router.get('/error', (req, res) => {
  throw new Error('wow such error')
})

module.exports = router
