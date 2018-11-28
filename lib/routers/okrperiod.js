const Router = require('koa-router')

const ajvValidator = require('../middlewares/ajv')
const objectFind = require('../middlewares/object-find')
const okrperiodCtrl = require('../controllers/okrperiod')
const okrobjectiveCtrl = require('../controllers/okrobjective')

const router = new Router()
  .post(
    '/organizations/:_organizationId/okrperiods',
    ajvValidator({
      type: 'object',
      properties: {
        _organizationId: { type: 'string', format: 'objectid' },
        name: { type: 'string', maxLength: 100 },
        startDate: { type: 'string', format: 'date-time' },
        endDate: { type: 'string', format: 'date-time' },
        dateType: { type: 'number', minimum: 0, maximum: 4 }
      },
      required: ['name', 'startDate', 'endDate', '_organizationId']
    }),
    async (ctx, next) => {
      await okrperiodCtrl.createOkrperiodAPI(ctx, next)
    }
  )
  .get(
    '/organizations/:_organizationId/okrperiods',
    ajvValidator({
      type: 'object',
      properties: {
        _organizationId: { type: 'string', format: 'objectid' }
      },
      required: ['_organizationId']
    }),
    async (ctx, next) => {
      await okrperiodCtrl.getOkrperiodAPI(ctx, next)
    }
  )
  .put(
    '/okrperiods/:_okrPeriodId',
    ajvValidator({
      type: 'object',
      properties: {
        _okrPeriodId: { type: 'string', format: 'objectid' },
        name: { type: 'string', maxLength: 100 },
        startDate: { type: 'string', format: 'date-time' },
        endDate: { type: 'string', format: 'date-time' },
        isEnd: { type: 'boolean' },
        dateType: { type: 'number', minimum: 0, maximum: 4 }
      },
      required: ['_okrPeriodId']
    }),
    objectFind('okrperiod', '_okrPeriodId'),
    async (ctx, next) => {
      await okrperiodCtrl.updateOkrperiodAPI(ctx, next)
    }
  )
  .delete(
    '/okrperiods/:_okrPeriodId',
    ajvValidator({
      type: 'object',
      properties: {
        _okrPeriodId: { type: 'string', format: 'objectid' }
      },
      required: ['_okrPeriodId']
    }),
    objectFind('okrperiod', '_okrPeriodId'),
    async (ctx, next) => {
      await okrperiodCtrl.deleteOkrperiodAPI(ctx, next)
    }
  )
  .get(
    '/okrperiods/:_okrPeriodId/activities',
    ajvValidator({
      type: 'object',
      properties: {
        _okrPeriodId: { type: 'string', format: 'objectid' }
      },
      required: ['_okrPeriodId']
    }),
    objectFind('okrperiod', '_okrPeriodId'),
    async (ctx, next) => {
      await okrobjectiveCtrl.getOkrPeriodActiviesAPI(ctx, next)
    }
  )
  .get(
    '/okrperiods/:_okrPeriodId/exportexcel',
    ajvValidator({
      type: 'object',
      properties: {
        _okrPeriodId: { type: 'string', format: 'objectid' }
      },
      required: ['_okrPeriodId']
    }),
    objectFind('okrperiod', '_okrPeriodId'),
    async (ctx, next) => {
      await okrobjectiveCtrl.exportOkrperiodDataAPI(ctx, next)
    }
  )

module.exports = router
