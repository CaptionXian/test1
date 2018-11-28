const bodyParser = require('koa-bodyparser')
const fs = require('fs')
const path = require('path')
const Router = require('koa-router')

const { authMiddleware } = require('../middlewares/auth')
const okrconnection = require('./okrconnection')
const okrobjective = require('./okrobjective')
const okrperiod = require('./okrperiod')
const okrgradingstandard = require('./okrgradingstandard')
const okrcomment = require('./okrcomment')
const organization = require('./organization')
const okrassociation = require('./okrassociation')
const okrremind = require('./okrremind')
const okrsuperadmin = require('./okrsuperadmin')
const ratelimit = require('../middlewares/ratelimit')()
const axios = require('../utils/axios')
const config = require('config')

const router = (module.exports = new Router())

const pkg = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../../package.json'), 'utf8')
)

router.get('/(version)?', (ctx, next) => {
  ctx.body = pkg.version
})

router.get('/token', async (ctx, next) => {
  const code  = ctx.query
  const result = await axios.axios_post(
    config.AUTH_URL,
    {
      client_id: config.CLIENT_ID,
      client_secret: config.CLIENT_SECRET,
      code: code.code
    }
  )
  const token = {
    'token': result.data.access_token
  }
  ctx.body = token
})

router.get('/swagger', async (ctx, next) => {
  await ctx.render('index')
})

router.use(ratelimit)
router.use(
  authMiddleware.unless({
    path: ['/', 'version', 'swagger', 'token'],
    ext: ['.jpg', '.html', '.css', '.js', '.png', '.ico']
  })
)

router.use(bodyParser())

router.use(okrconnection.routes())
router.use(okrobjective.routes())
router.use(okrperiod.routes())
router.use(okrgradingstandard.routes())
router.use(okrcomment.routes())
router.use(organization.routes())
router.use(okrassociation.routes())
router.use(okrremind.routes())
router.use(okrsuperadmin.routes())

router.all('*', async ctx => {
  ctx.throw(404, 'notfound')
})
