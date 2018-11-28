const okrperiodCtrl = require('../controllers/okrperiod')
const db = require('../services/mongo')

// 删除目标周期, 删除周期下的目标
okrperiodCtrl.on('inhouse.okrperiod.remove', async ctx => {
  const { okrperiod } = ctx.state
  if (!okrperiod) return
  await db.okrobjective.update(
    { _okrPeriodId: okrperiod._id },
    { isDeleted: true },
    { multi: true }
  )
})
