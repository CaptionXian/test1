const db = global.db
const ObjectId = require('mongoose').Types.ObjectId

const { mocker } = require('../tools/index')
const request = require('supertest')(global.server)

describe('okrconnection api', () => {
  it('get okrconnection should be ok', async () => {
    let _organizationId = ObjectId()
    let user = mocker.user()

    let okrconnection = await db.okrconnection.create(
      mocker.okrconnection({
        _organizationId
      })
    )

    const resp = await request
      .get(`/organizations/${_organizationId}/okrconnections`)
      .set('Authorization', 'OAuth2 ' + user.accessToken)
      .expect(200)

    const body = resp.body
    expect(body).toHaveLength(1)
    expect(body[0]._id).toBe(`${okrconnection._id}`)
  })

  it('create okrconnection should be ok', async () => {
    let _organizationId = ObjectId()
    let user = mocker.user()

    let fromOkrobjective = await db.okrobjective.create(
      mocker.okrobjective({
        _organizationId
      })
    )

    let toOkrobjective = await db.okrobjective.create(
      mocker.okrobjective({
        _organizationId
      })
    )

    let mockOkrConnection = mocker.okrconnection({
      _organizationId,
      _fromId: fromOkrobjective._id,
      _toId: toOkrobjective._id
    })

    const resp = await request
      .post(`/organizations/${_organizationId}/okrconnections`)
      .set('Authorization', 'OAuth2 ' + user.accessToken)
      .send(mockOkrConnection)
      .expect(200)

    const body = resp.body
    expect(body.note).toBe(mockOkrConnection.note)
    expect(body._fromId).toBe(mockOkrConnection._fromId)
    expect(body._toId).toBe(mockOkrConnection._toId)
  })

  it('delete okrconnection should be ok', async () => {
    let _organizationId = ObjectId()
    let user = mocker.user()

    let okrconnection = await db.okrconnection.create(
      mocker.okrconnection({
        _organizationId
      })
    )

    await request
      .delete(
        `/organizations/${_organizationId}/okrconnections/${okrconnection._id}`
      )
      .set('Authorization', 'OAuth2 ' + user.accessToken)
      .expect(200)
  })

  it('update okrconnection should be ok', async () => {
    let _organizationId = ObjectId()
    let user = mocker.user()

    let okrconnection = await db.okrconnection.create(
      mocker.okrconnection({
        _organizationId
      })
    )

    const resp = await request
      .put(
        `/organizations/${_organizationId}/okrconnections/${
          okrconnection._id
        }/note`
      )
      .set('Authorization', 'OAuth2 ' + user.accessToken)
      .send({
        note: '233'
      })
      .expect(200)
    expect(resp.body.note).toBe('233')
  })
})
