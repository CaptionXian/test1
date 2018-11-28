const objectMap = {
  activity: '动态',
  user: '用户',
  organization: '企业',
  project: '项目',
  member: '成员',
  api: '接口',
  email: '邮箱',
  role: '角色',
  name: '名称'
}

/*
错误定义:
  name: 全局唯一错误名
  status: 返回的http statuscode
  message:
  'zh': 错误描述信息 可以是函数
  'en': 错误描述信息 可以是函数
*/

module.exports = [
  {
    name: 'NoContent',
    status: 204,
    message: {
      zh: '',
      en: ''
    }
  },
  {
    name: 'BadRequestError',
    status: 400,
    message: {
      zh: '参数有误',
      en: 'Bad Request'
    }
  },
  {
    name: 'InvalidRequest',
    status: 400,
    message: {
      zh: '请求不合法',
      en: 'Invalid request'
    }
  },
  {
    name: 'ParamError',
    status: 400,
    message: {
      zh (param) {
        if (param) {
          return `参数有误: ${param}`
        } else {
          return '参数有误'
        }
      },
      en (param) {
        if (param) {
          return `Invalid parameter: ${param}`
        } else {
          return 'Invalid parameters'
        }
      }
    }
  },
  {
    name: 'RequiredError',
    status: 400,
    message: {
      zh (param) {
        if (param instanceof Array) {
          param.join(' & ')
        }
        if (param) {
          return `${param} 是必须的`
        } else {
          return '缺少必须的参数, 查看文档获取更多信息'
        }
      },
      en (param) {
        if (param instanceof Array) {
          param.join(' & ')
        }
        if (param) {
          return `${param} is required`
        } else {
          return 'Miss required parameter, see doc for more info.'
        }
      }
    }
  },
  {
    name: 'ExceedLimit',
    status: 400,
    message: {
      zh (limit, param) {
        if (limit) {
          if (param) return `${param} 超出限制 ${limit}`
          return `超出限制 ${limit}`
        } else {
          return '超出限制'
        }
      },
      en (limit, param) {
        if (limit) {
          if (param) return `${param} Exceed limit ${limit}`
          return `Exceed limit ${limit}`
        } else {
          return 'Exceed limit'
        }
      }
    }
  },
  {
    name: 'AccessTokenMissing',
    status: 401,
    message: {
      zh: '缺少 access_token',
      en: '"access_token" missing'
    }
  },
  {
    name: 'InvalidAccessToken',
    status: 401,
    message: {
      zh: '不合法的 access_token',
      en: 'Invalid access_token'
    }
  },
  {
    name: 'InvalidCookie',
    status: 401,
    message: {
      zh: '授权信息无效或已在其他地方退出登录',
      en: 'Authorization invalid or logout somewhere'
    }
  },
  {
    name: 'NoPermission',
    status: 403,
    message: {
      zh: '无权限操作资源，访问被拒绝',
      en: 'The operation has no permission'
    }
  },
  {
    name: 'NotFound',
    status: 404,
    message: {
      zh (what) {
        if (what && objectMap[what]) {
          return `${objectMap[what]}不存在`
        } else {
          return '访问的资源不存在'
        }
      },
      en (what) {
        if (what) {
          return `${what} not found`
        } else {
          return 'Resource not found'
        }
      }
    }
  },
  {
    name: 'AccessDenied',
    status: 403,
    message: {
      zh: '用户或授权服务器拒绝授予数据访问权限',
      en: 'User or server denied your request'
    }
  }
]
