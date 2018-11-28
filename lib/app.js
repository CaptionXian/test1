const fs = require('fs')
const path = require('path')
const ilog = require('ilog')
const requireDir = require('require-dir')
const config = require('config')
const Koa = require('koa')
const locales = require('koa-locales')
const cors = require('koa2-cors')
const views = require('koa-views')
const serve = require('koa-static')

require('./services/mongo')
const errorHandler = require('./middlewares/error-handler')
const logger = require('./services/logger')

const options = {
  defaultLocale: 'zh',
  dirs: [path.resolve(__dirname, '../locales')]
}

const pkg = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf8')
)
const app = new Koa()

locales(app, options)

if (!/test/.test(process.env.NODE_ENV)) {
  app.use(logger())
}

app.use(
  cors({
    origin: '*',
    credentials: true,
    allowMethods: ['GET', 'POST', 'DELETE', 'PUT', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'Accept']
  })
)
app.use(errorHandler)

app.use(serve(__dirname + '/public/swagger'))

app.use(views(__dirname + '/public/swagger'));
const router = require('./routers')
app.use(router.routes())

const server = app.listen(config.PORT, () => {
  ilog.info({
    message: `${pkg.name}@${pkg.version} start listen ${config.PORT} ...`
  })
})

// const okrremindCtrl = require('./controllers/okrremind')
// okrremindCtrl.scheduleCronstyle()

requireDir('./observers')

module.exports = server
