require('../../lib/services/mongo')
const db = require('../services/mongo')
const ObjectId = require('mongoose').Types.ObjectId
const { mocker } = require('../tools/index')
const okrperiodCtrl = require('../../lib/controllers/okrperiod')

describe('okrperiodCtrl findPeriodIds', () => {
  let organization

  beforeEach(async () => {
    // 创建企业
    organization = {
      _id: ObjectId()
    }

    // 创建周期 period
    await db.okrperiod.create(
      mocker.okrperiod({
        _organizationId: organization._id,
        startDate: new Date('2017-08-01T00:00:00.000Z'),
        endDate: new Date('2017-08-20T23:59:59.999Z')
      })
    )

    await db.okrperiod.create(
      mocker.okrperiod({
        _organizationId: organization._id,
        startDate: new Date('2017-08-10T00:00:00.000Z'),
        endDate: new Date('2017-08-30T23:59:59.999Z')
      })
    )
  })

  // 时间区间外
  it('endDate in the interval', async () => {
    let startDate = '2017-07-15T00:00:00.000Z'
    let endDate = '2017-07-31T00:00:00.000Z'
    let periodIds = await okrperiodCtrl.findPeriodIds(
      organization._id,
      startDate,
      endDate
    )
    expect(periodIds.length).toBe(0)
  })

  // 结束日期在区间中
  it('endDate in the interval', async () => {
    let startDate = '2017-07-15T00:00:00.000Z'
    let endDate = '2017-08-15T00:00:00.000Z'
    let periodIds = await okrperiodCtrl.findPeriodIds(
      organization._id,
      startDate,
      endDate
    )
    expect(periodIds.length).toBe(2)
  })

  // 结束日期在区间中, 只覆盖一个周期
  it('endDate in the interval', async () => {
    let startDate = '2017-07-15T00:00:00.000Z'
    let endDate = '2017-08-05T00:00:00.000Z'
    let periodIds = await okrperiodCtrl.findPeriodIds(
      organization._id,
      startDate,
      endDate
    )
    expect(periodIds.length).toBe(1)
  })

  // 开始日期在区间中
  it('endDate in the interval', async () => {
    let startDate = '2017-08-15T00:00:00.000Z'
    let endDate = '2017-09-15T00:00:00.000Z'
    let periodIds = await okrperiodCtrl.findPeriodIds(
      organization._id,
      startDate,
      endDate
    )
    expect(periodIds.length).toBe(2)
  })

  // 开始结束时间包含区间
  it('endDate in the interval', async () => {
    let startDate = '2017-07-15T00:00:00.000Z'
    let endDate = '2017-09-15T00:00:00.000Z'
    let periodIds = await okrperiodCtrl.findPeriodIds(
      organization._id,
      startDate,
      endDate
    )
    expect(periodIds.length).toBe(2)
  })
})
