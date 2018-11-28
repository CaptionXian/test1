module.exports = Schema => {
    return new Schema(
      {
        _organizationId: {
          type: Schema.Types.ObjectId,
          required: true
        },
        _userId: {
          type: Schema.Types.ObjectId,
          required: true
        },
        _creatorId: {
            type: Schema.Types.ObjectId,
            required: true
        },
        isDeleted: {
          type: Boolean,
          default: false,
          required: true
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