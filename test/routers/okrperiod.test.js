const db = global.db
const ObjectId = require('mongoose').Types.ObjectId

const { mocker } = require('../tools/index')
const request = require('supertest')(global.server)

describe('okrperiod api', () => {
  let _organizationId, user
  beforeEach(async () => {
    _organizationId = ObjectId()
    user = mocker.user()
  })

  it('get okrperiod should be ok', async () => {
    let okrperiod = await db.okrperiod.create(
      mocker.okrperiod({
        _organizationId
      })
    )

    const resp = await request
      .get(`/organizations/${_organizationId}/okrperiods`)
      .set('Authorization', 'OAuth2 ' + user.accessToken)
      .expect(200)

    const body = resp.body
    expect(body).toHaveLength(1)
    expect(body[0]._id).toBe(`${okrperiod._id}`)
  })

  it('create okrperiod should be ok', async () => {
    let mockOkrperiod = mocker.okrperiod({
      _organizationId
    })

    const resp = await request
      .post(`/organizations/${_organizationId}/okrperiods`)
      .set('Authorization', 'OAuth2 ' + user.accessToken)
      .send(mockOkrperiod)
      .expect(200)

    const body = resp.body
    expect(body._organizationId).toBe(mockOkrperiod._organizationId)
  })

  it('delete okrperiod should be ok', async () => {
    let okrperiod = await db.okrperiod.create(mocker.okrperiod())

    await request
      .delete(`/okrperiods/${okrperiod._id}`)
      .set('Authorization', 'OAuth2 ' + user.accessToken)
      .expect(200)
  })

  it('update okrperiod should be ok', async () => {
    let okrperiod = await db.okrperiod.create(
      mocker.okrperiod({
        _organizationId
      })
    )

    const resp = await request
      .put(`/okrperiods/${okrperiod._id}`)
      .set('Authorization', 'OAuth2 ' + user.accessToken)
      .send({
        name: '233'
      })
      .expect(200)
    expect(resp.body.name).toBe('233')
  })
})
