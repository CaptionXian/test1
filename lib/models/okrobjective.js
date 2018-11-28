module.exports = Schema => {
  const OkrMeasureSchema = require('./okrmeasure')(Schema)
  
  const OkrobjectiveSchema = new Schema(
    {
      title: {
        type: String,
        maxLength: 500,
        required: true
      },
      // 目标类型, 一旦创建不可更改
      boundToObjectType: {
        type: String,
        enum: ['organization', 'team', 'member'],
        required: true,
        default: 'member'
      },
      // 目标类型绑定对象id, 分别为 _organizationId, _teamId, _executorId
      _boundToObjectId: {
        type: Schema.Types.ObjectId,
        required: true
      },
      // 目标级别，一旦创建不可更改
      objectiveLabel:{
        type: String,
        enmu: ['objective', 'keyresult', 'KPI'],
        required: true,
        default: 'objective'
      },
      // 进度衡量方式，子目标所用
      measure: {
        type: OkrMeasureSchema,
        default: {}
      },
      // 评分值
      score: {
        type: Number,
        min: 0,
        max: 100,
        required: true,
        default: 0
      },
      // 结果总结
      resultSummary: {
        type: String,
        maxLength: 500,
        default: ''
      },
      // 权重值
      weight: {
        type: Number,
        min: 1,
        max: 10,
        default: 5
      },
      progress: {
        type: Number,
        min: 0,
        max: 100,
        required: true,
        default: 0
      },
      _executorId: {
        type: Schema.Types.ObjectId,
        required: true,
        set: val => {
          // 如果目标类型为 成员, 则 _boundToObjectId 与 _executorId 同步更新
          if (val && this.boundToObjectType === 'member') {
            this._boundToObjectId = val
          }
          return val
        }
      },
      _okrPeriodId: {
        type: Schema.Types.ObjectId
      },
      ancestorIds: [
        {
          type: Schema.Types.ObjectId
        }
      ],
      _organizationId: {
        type: Schema.Types.ObjectId,
        required: true
      },
      // 是否中止状态
      isSuspended: {
        type: Boolean,
        default: false
      },
      // 中止相关人id列表
      relatedUserIds: [
        {
          type: Schema.Types.ObjectId
        }
      ],
      // 中止原因记录
      note: {
        type: String,
        maxLength: 500,
        default: ''
      },
      isDeleted: {
        type: Boolean,
        default: false
      },
      //  是否完成
      isDone: {
        type: Boolean,
        default: false
      },
      _creatorId: {
        type: Schema.Types.ObjectId,
        required: true
      },
      created: { type: Date, default: Date.now },
      updated: { type: Date, default: Date.now }
    },
    {
      read: 'secondaryPreferred',
      id: false,
      toObject: {
        virtuals: true,
        getters: true
      },
      toJSON: {
        versionKey: false,
        virtuals: true,
        getters: true,
        transform (doc, ret, options) {
          delete ret.isDeleted
          return ret
        }
      }
    }
  )

  OkrobjectiveSchema.methods.getTitle = function () {
    return this.title
  }

  return OkrobjectiveSchema
}
