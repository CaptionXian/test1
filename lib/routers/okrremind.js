const Router = require('koa-router')
const ajvValidator = require('../middlewares/ajv')
const okrremindCtrl = require('../controllers/okrremind')
const objectFind = require('../middlewares/object-find')

const router = new Router()

  //   获取当前企业提醒配置信息
  .get(
    '/organization/:_organizationId/remind',
    ajvValidator({
      type: 'object',
      properties: {
        _organizationId: {
          type: 'string',
          format: 'objectid'
        }
      },
      require: ['_organizationId']
    }),
    async (ctx, next) => {
      await okrremindCtrl.getRemindByOrgIdAPI(ctx, next)
    }
  )

  //  创建提醒配置
  .post(
    '/organization/:_organizationId/remind',
    ajvValidator({
      type: 'object',
      properties: {
        model: { type: 'string' },
        type: { type: 'string' },
        repeat: { type: 'string' },
        datas: {
          type: 'array',
          items: { type: 'number' }
        },
        time: { type: 'string' },
        _periods: {
          type: 'array',
          items: {
            type: 'string'
          }
        }
      },
      require: ['_organizationId', 'model', 'datas', 'time', '_periods']
    }),
    async (ctx, next) => {
      await okrremindCtrl.createOkrremindAPI(ctx, next)
    }
  )

  //  更新提醒配置
  .put(
    '/okrremind/:_okrRemindId',
    ajvValidator({
      type: 'object',
      properties: {
        model: { type: 'string' },
        type: { type: 'string' },
        repeat: { type: 'string' },
        datas: {
          type: 'array',
          items: { type: 'number' }
        },
        time: { type: 'string' },
        _periods: {
          type: 'array',
          items: {
            type: 'string'
          }
        }
      },
      require: ['_organizationId', 'model', 'datas', 'time', '_periods']
    }),
    objectFind('okrremind', '_okrRemindId'),
    async (ctx, next) => {
      await okrremindCtrl.updateOkrremindAPI(ctx, next)
    }
  )

  //  删除提醒配置
  .delete(
    '/okrremind/:_okrRemindId',
    ajvValidator({
      type: 'object',
      properties: {
        _okrRemindId: {
          type: 'string',
          format: 'objectid'
        }
      },
      require: ['_okrRemindId']
    }),
    objectFind('okrremind', '_okrRemindId'),
    async (ctx, next) => {
      await okrremindCtrl.deleteOkrremindAPI(ctx, next)
    }
  )

module.exports = router
