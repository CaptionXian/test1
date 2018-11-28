module.exports = Schema => {
  const BoundObjectSchema = new Schema({
    _objectId: Schema.Types.ObjectId,
    objectType: String
  })

  const ActivitySchema = new Schema(
    {
      action: String,
      content: {
        type: Schema.Types.Mixed
      },

      isDeleted: { type: Boolean, default: false },
      created: { type: Date, default: Date.now },
      updated: { type: Date, default: Date.now },

      _creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      boundToObjects: [BoundObjectSchema]
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
        transfrom (doc, ret, options) {
          delete ret.isDeleted
          return ret
        }
      }
    }
  )

  return ActivitySchema
}
