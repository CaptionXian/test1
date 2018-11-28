const Router = require('koa-router')

const ajvValidator = require('../middlewares/ajv')
const objectFind = require('../middlewares/object-find')
const okrcommentCtrl = require('../controllers/okrcomment')

const router = new Router()
  .post(
    '/organizations/:_organizationId/okrobjectives/:_okrObjectiveId/comments',
    ajvValidator({
      type: 'object',
      properties: {
        content: { type: 'string' },
        _organizationId: { type: 'string', format: 'objectid' },
        _okrObjectiveId: { type: 'string', format: 'objectid' },
      },
      required: ['content', '_organizationId', '_okrObjectiveId']
    }),
    async (ctx, next) => {
      await okrcommentCtrl.creatOkrComment(ctx, next)
    }
  )
  .get(
    '/organizations/:_organizationId/okrobjectives/:_okrObjectiveId/comments',
    ajvValidator({
      type: 'object',
      properties: {
        _organizationId: { type: 'string', format: 'objectid' },
        _okrObjectiveId: { type: 'string', format: 'objectid' },
      },
      required: ['_organizationId', '_okrObjectiveId']
    }),
    async (ctx, next) => {
      await okrcommentCtrl.getOkrComment(ctx, next)
    }
  )
  .get(
    '/organizations/:_organizationId/okrobjectives/:_okrObjectiveId/comments/:_okrCommentId',
    ajvValidator({
      type: 'object',
      properties: {
        _organizationId: { type: 'string', format: 'objectid' },
        _okrObjectiveId: { type: 'string', format: 'objectid' },
        _okrCommentId: { type: 'string', format: 'objectid' },
      },
      required: ['_organizationId', '_okrObjectiveId', '_okrCommentId']
    }),
    objectFind('okrcomment', '_okrCommentId'),
    async (ctx, next) => {
      await okrcommentCtrl.getOkrCommentById(ctx, next)
    }
  )
  .put(
    '/organizations/:_organizationId/okrobjectives/:_okrObjectiveId/comments/:_okrCommentId',
    ajvValidator({
      type: 'object',
      properties: {
        content: { type: 'string' },
        _organizationId: { type: 'string', format: 'objectid' },
        _okrObjectiveId: { type: 'string', format: 'objectid' },
        _okrCommentId: { type: 'string', format: 'objectid' },
      },
      required: ['content', '_organizationId', '_okrObjectiveId', '_okrCommentId']
    }),
    async (ctx, next) => {
      await okrcommentCtrl.updateOkrComment(ctx, next)
    }
  )
  .delete(
    '/organizations/:_organizationId/okrobjectives/:_okrObjectiveId/comments/:_okrCommentId',
    ajvValidator({
      type: 'object',
      properties: {
        _organizationId: { type: 'string', format: 'objectid' },
        _okrObjectiveId: { type: 'string', format: 'objectid' },
        _okrCommentId: { type: 'string', format: 'objectid' },
      },
      required: ['_organizationId', '_okrObjectiveId', '_okrCommentId']
    }),
    objectFind('okrcomment', '_okrCommentId'),
    async (ctx, next) => {
      await okrcommentCtrl.deleteOkrComment(ctx, next)
    }
  )

module.exports = router
