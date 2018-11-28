const _ = require('lodash')
const { createErr } = require('http-errors')
const db = require('../services/mongo')

module.exports = (model, idField = '_id', throwError = true, _newField) => {
  return async (ctx, next) => {
    const _id = _.result(
      Object.assign({}, ctx.state.params, ctx.state),
      idField
    )
    let modelName = model
    
    if (!_id) {
      if (throwError) {
        ctx.throw(createErr('NotFound', modelName))
      } else {
        return next()
      }
    }

    if (!db[modelName]) {
      ctx.throw(createErr('ParamError', modelName))
    }
    const object = await db[modelName].findById(_id)
    if (throwError && (!object || object.isDeleted)) {
      ctx.throw(createErr('NotFound', modelName))
    }

    const newField = _newField || modelName
    ctx.state[newField] = object
    await next()
  }
}
