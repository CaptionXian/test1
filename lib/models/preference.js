module.exports = Schema => {
  return new Schema(
    {
      _organizationId: {
        type: Schema.Types.ObjectId,
        required: true
      },

      permissions: {
        type: Schema.Types.Mixed
      },

      okrProgressMode: {
        type: Schema.Types.String,
        default: 'okrkeyresult',
        enum: ['manual', 'okrkeyresult']
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
