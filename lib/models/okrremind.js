module.exports = Schema => {
  const OkrremindSchema = new Schema(
    {
      //  提醒模块（进度更新 或 目标评分）
      model: {
        type: String,
        enum: ['progress', 'grade'],
        default: 'progress',
        required: true
      },
      //  目标类型（ model 为 progress 时有值）
      type: {
        type: String,
        enum: ['organization', 'team', 'member']
      },
      //  重复提醒（0：每日提醒, 1：每周提醒, 2: 每月提醒）（ model 为 progress 时有值）
      repeat: {
        type: Number,
        enum: ['0', '1', '2'],
        default: '1',
      },
      //  提醒日期
      dates: [
        {
          type: Number,
          required: true
        }
      ],
      //  提醒时间
      time: {
        type: String,
        default: Date.now,
        required: true
      },
      //  是否删除
      isDeleted: {
        type: Boolean,
        default: false,
        required: true
      },
      //  企业
      _organizationId: {
        type: Schema.Types.ObjectId,
        required: true
      },
      //  创建人
      _creatorId: {
        type: Schema.Types.ObjectId,
        required: true
      },
      //  适用周期
      _periods: [
        {
          type: Schema.Types.ObjectId,
          required: true
        }
      ],
      //  创建时间
      created: { type: Date, default: Date.now },
      //  更新时间
      updated: { type: Date, default: Date.now }
    },
    {
      read: 'secondaryPreferred',
      id: false,
      toJSON: {
        versionKey: false
      }
    }
  )

  return OkrremindSchema
}
