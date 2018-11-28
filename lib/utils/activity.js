const formatter = require('../services/activity/formatter')

const activityTitleTransform = async (ctx, _organizationId) => {
  let result = ctx.body
  if (!Array.isArray(result)) {
    result = [ctx.body]
  }

  const options = {
    _organizationId
  }
  for (let item of result) {
    console.log("tttt",item)
    await formatter.format(item, options)
    item.title = ctx.__(item.action, item.content)
  }
}

module.exports = {
  activityTitleTransform
}
