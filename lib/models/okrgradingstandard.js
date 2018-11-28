module.exports = Schema => {
  const OkrGradingStandardSchema = new Schema(
    {
      //  关键结果评分标准
      //  分数
      gradingStandards: [{
        score: {
          type: Number,
          min: 0,
          max: 100,
          required: true
        },
        //  描述
        describe: {
          type: String,
          required: true,
        }
      }],
      standardType: {
        // 0:系统 1:周期 2：目标
        type: Number,
        required: true,
      },
      // 评分标准关联对象的id
      _okrLinkId: {
        type: Schema.Types.ObjectId,
        required: true,
      },
      // 企业id
      _organizationId: {
        type: Schema.Types.ObjectId,
        required: true
      }
    },
    {
      id: false,
      read: 'secondaryPreferred',
      toJSON: {
        versionKey: false
      },
      timestamps: { 
        createdAt: 'created', 
        updatedAt: 'updated' 
      }
    }
  )

  return OkrGradingStandardSchema
}
