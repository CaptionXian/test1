module.exports = Schema => {
  const OkrAssociationSchema = new Schema(
    {
      // 关联方式 读取任务完成进度, 读取指定目标或关键结果的进度
      type: {
        type: String,
        enum: ['task', 'objective'],
        default: 'task'
      },
      //  所关联的目标ID
      _okrObjectiveId: {
        type: Schema.Types.ObjectId,
        required: true
      },
      //  关联的任务（目标）的ObjectId
      _associationId: {
        type: Schema.Types.ObjectId,
        required: true
      },
      // 权重值
      dataWeight: {
        type: Number,
        min: 1,
        max: 10,
        default: 5
      },
      _creatorId: {
        type: Schema.Types.ObjectId,
        required: true
      },
      isDeleted: {
        type: Boolean,
        default: false
      },
      created: { type: Date, default: Date.now },
      updated: { type: Date, default: Date.now }
    },
    {
      id: false,
      read: 'secondaryPreferred',
      toJSON: {
        versionKey: false
      }
    }
  )

  return OkrAssociationSchema
}
