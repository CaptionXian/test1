const _ = require('lodash')
const Ajv = require('ajv')
const { createErr } = require('http-errors')

// useDefaults: 开启`default`关键字
// coerceTypes: 支持数据类型转换
const defaults = { useDefaults: true, coerceTypes: true }

/*
  ajv 自身有 cache 机制, 每次 compile 之后会有一个 cache, 每次都 new Ajv 会使 cache 失效
  这里针对每个 options 都在外部 cache 一个 ajv 实例, 达到复用, 而不是每次都 new Ajv
*/
let ajvCache = {}

const __validate = (ajvOptions = {}) => {
  let options = _.assign({}, defaults, ajvOptions)

  let key = JSON.stringify(options)
  let cached = ajvCache[key]
  if (cached) {
    return cached
  }
  const ajv = new Ajv(options)
  // objectid format
  ajv.addFormat('objectid', /^[a-z0-9]{24}$/)

  // objectidwithnull format
  ajv.addFormat(
    'objectidornull',
    val => val === 'null' || /^[a-z0-9]{24}$/.test(val)
  )

  // 将字符串'null'转化为null
  ajv.addKeyword('parseNull', {
    compile: schema => {
      return (data, dataPath, parentData, parentDataProperty, rootData) => {
        if (typeof schema !== 'boolean') return false
        if (schema && data === 'null') parentData[parentDataProperty] = null
        return true
      }
    }
  })

  // 去掉字符串两边的空格
  ajv.addKeyword('trim', {
    compile: schema => {
      return (data, dataPath, parentData, parentDataProperty, rootData) => {
        if (typeof schema !== 'boolean') return false
        if (schema) parentData[parentDataProperty] = data.trim()
        return true
      }
    }
  })

  /**
   * @author jiangwei
   * @desc 严格校验
   * 支持选项:{
   *  trim: true // 默认去除空格,
   *  maxLength: 100 // 默认100
   *  minLength: 1 // 默认为1
   * }
   *
   * Demo: {
   *  type: 'string',
   *  strict: {
   *     trim: false,
   *     maxLength: 500,
   *     minLength: 10
   *   }
   * }
   *
   */
  ajv.addKeyword('strict', {
    type: 'string',
    compile: (sch, parentSchema) => {
      return (data, dataPath, parentData, parentDataProperty, rootData) => {
        let maxLength = sch.maxLength || 100
        let minLength = sch.minLength || 1

        if (!(sch.trim === false)) parentData[parentDataProperty] = data.trim()

        if (!parentData[parentDataProperty]) return false
        if (parentData[parentDataProperty].length > maxLength) return false
        if (parentData[parentDataProperty].length < minLength) return false

        return true
      }
    }
  })

  ajvCache[key] = ajv
  return ajv
}

/**
 * @author lee [qiang@teambition.com]
 * @description 从 ajv.errors 中提取出错误字段
 * @param {array} errors
 */
const pickFieldFromErrors = errors => {
  // 属性错误时，会有可能触发多个规则，故会产生重复，使用`_.uniq`去重
  return _.uniq(
    errors.map(ele => {
      if (ele.keyword === 'required') {
        return ele.params.missingProperty
      }
      return ele.dataPath.substr(1)
    })
  )
}

const validator = (schema, params) => {
  let schemaCopied = _.clone(schema)
  let { ajvOptions } = schemaCopied
  delete schemaCopied.ajvOptions
  const ajv = __validate(ajvOptions)
  let validator = ajv.compile(schemaCopied)
  let isValid = validator(params)
  if (!isValid) {
    let fields = pickFieldFromErrors(validator.errors).join(',')
    return fields
  }
}

module.exports = schema => {
  return (ctx, next) => {
    ctx.state.params = Object.assign(
      {},
      ctx.params,
      ctx.request.body,
      ctx.request.query
    )

    let fields = validator(schema, ctx.state.params)

    if (fields) {
      ctx.throw(createErr('ParamError', fields))
    }
    return next()
  }
}
