module.exports = async ctx => {
  const isArray = Array.isArray(ctx.body)
  ctx.body = !isArray ? [ctx.body] : ctx.body

  const itemPromises = ctx.body.map(
    async item => (item.toJSON ? item.toJSON() : item)
  )

  let result = []
  for (const itemPromise of itemPromises) {
    result.push(await itemPromise)
  }

  ctx.body = isArray ? result : result[0]
}
