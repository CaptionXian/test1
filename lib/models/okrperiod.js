module.exports = Schema => {
  const OkrperiodSchema = new Schema(
    {
      name: {
        type: String,
        maxLength: 100,
        required: true
      },
      startDate: {
        type: Date,
        required: true
      },
      endDate: {
        type: Date,
        required: true
      },
      dateType: {
        type: Number,
        default: 0
      },
      _organizationId: {
        type: Schema.Types.ObjectId,
        required: true
      },
      isDeleted: {
        type: Boolean,
        default: false
      },
      isEnd: {
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

  return OkrperiodSchema
}
