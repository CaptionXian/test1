const okrgradingstandardCtrl = require('../controllers/okrgradingstandard')
const ActivityPool = require('../services/activity/pool')

// 修改评分目标评分标准添加记录
okrgradingstandardCtrl.on('inhouse.okrgradingstandard.update', async ctx => {
  const { user, okrobjective } = ctx.state
  const action = 'update.gradingStandard'
  const content = { title: okrobjective.title }
  await ActivityPool.okrobjective.createAction(
    user._id,
    action,
    okrobjective._id,
    content
  )
})

// 删除评分目标评分标准添加记录
okrgradingstandardCtrl.on('inhouse.okrgradingstandard.delete', async ctx => {
  const { user, okrobjective } = ctx.state
  const action = 'delete.gradingStandard'
  const content = { title: okrobjective.title }
  await ActivityPool.okrobjective.createAction(
    user._id,
    action,
    okrobjective._id,
    content
  )
})
