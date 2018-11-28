module.exports = Schema => {
  const OkrMeasureSchema = new Schema(
    {
      // 衡量方式 是否完成, 百分比, 数值
      mode: {
        type: String,
        enum: [
          'boolean',
          'percentage',
          'numeric'
        ],
        // default: 'percentage'
      },
      // 起始值
      initial: {
        type: Number,
        min: 0,
        // default: 0
      },
      // 目标值
      target: {
        type: Number,
        min: 0,
        // default: 100
      },
      // 当前值
      current: {
        type: Number,
        min: 0,
        // default: 0
      },
      // 单位
      unit: {
        type: String,
        maxLength: 10,
        // default: ''
      }
    },
    {
      id: false,
      _id: false,
      read: 'secondaryPreferred',
      toJSON: {
        versionKey: false
      }
    }
  )

  return OkrMeasureSchema
}
