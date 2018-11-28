/* @author: 李强
 * 目标管理应用: 目标联系模型
*/
module.exports = Schema => {
  return new Schema(
    {
      _creatorId: {
        type: Schema.Types.ObjectId,
        required: true
      },
      _organizationId: {
        type: Schema.Types.ObjectId,
        required: true
      },

      _fromId: {
        type: Schema.Types.ObjectId,
        required: true
      },

      _toId: {
        type: Schema.Types.ObjectId,
        required: true
      },
      note: {
        type: String,
        default: ''
      },

      created: {
        type: Date,
        default: Date.now
      },

      updated: {
        type: Date,
        default: Date.now
      }
    },
    {
      read: 'secondaryPreferred',
      id: false,
      toJSON: {
        versionKey: false
      }
    }
  )
}
