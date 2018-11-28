module.exports = Schema => {
    const OkrprogressSchema = new Schema (
        {
            //  目标ID
            _okrObjectiveId: {
                type: Schema.Types.ObjectId,
                required: true
            },
            //  new progress
            newProgress: {
                type: Number,
                required: true,
                min: 0,
                max: 100,
                default: 0
            },
            //  old progress
            oldProgress: {
                type: Number,
                required: true,
                min: 0,
                max: 100,
                default: 0
            },
            _creatorId: {
                type: Schema.Types.ObjectId,
                required: true
            },
            created: { type: Date, default: Date.now }
        },
        {
            read: 'secondaryPreferred',
            id: false,
            toJSON: {
                versionKey: false
            }
        }
    )
    return OkrprogressSchema
}