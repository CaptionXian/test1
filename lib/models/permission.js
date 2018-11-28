module.exports = Schema => {
    return new Schema(
      {
        _organizationId: {
          type: Schema.Types.ObjectId,
          required: true
        },
        action: {
          type: String,
          enum: ['get', 'create', 'update', 'grade','other'],
          required: true
        }, 
        permissions: {
          type: Schema.Types.Mixed
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