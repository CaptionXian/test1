module.exports = Schema => {
  const OkrCommentSchema = new Schema(
    {
      //  目标评论
      //  分数
      content: {
        type: String,
        required: true
      },
      _okrObjectiveId: {
        type: Schema.Types.ObjectId,
        required: true
      },
      _creatorId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: ''
      },
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

  return OkrCommentSchema
}
