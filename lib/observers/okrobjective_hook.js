const okrobjectiveCtrl = require('../controllers/okrobjective')
const okrassociationCtrl = require('../controllers/okrassociation')
const ActivityPool = require('../services/activity/pool')

// 新建目标, 创建目标动态
okrobjectiveCtrl.on('inhouse.okrobjective.create', async ctx => {
  const result = ctx.body
  const { user } = ctx.state

  const okrobjective = result

  const action = 'create'
  const content = {
    title: okrobjective.title
  }

  await ActivityPool.okrobjective.createAction(
    user._id,
    action,
    okrobjective._id,
    content
  )
})

// 更新目标, 创建目标动态
okrobjectiveCtrl.on('inhouse.okrobjective.update', async ctx => {
  const { user, okrobjective, old } = ctx.state
  await okrobjectiveCtrl.createUpdateOkrobjectiveActivity(
    user,
    okrobjective,
    old
  )
})

// 更新关联信息权重, 创建目标动态
okrobjectiveCtrl.on('update.association.dataweight', async ctx => {
  const { user, okrobjective, okrassociation } = ctx.state
  const { type } = ctx.state.params
  await okrassociationCtrl.UpdateOkrAssociationActivity(
    user,
    okrassociation,
    okrobjective,
    type
  )
})
