const mongoose = require('mongoose')

const ReplySchema = mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: [true, 'Missing owner']
    },
    createdAt: {
        type: Date,
        default: new Date()
    },
    text: {
        type: String,
        maxlength: 500,
        required: [true, 'Missing content']
    }
})

const LikesSchema = mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: [true, 'Missing owner']
    },
    likeType: {
        type: String,
        enum: ['thumb', 'tree', 'sun', 'heart']
    }
})

const PostSchema = mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: [true, 'Missing owner']
    },
    createdAt: {
        type: Date,
        default: new Date()
    },
    title: {
        type: String,
        maxlength: 80,
        required: [true, 'Missing title']
    },
    text: {
        type: String,
        maxlength: 500,
        required: [true, 'Missing content']
    },
    pictures: {
        type: Array,
        of: {
            type: String,
            lowercase: true,
        }
    },
    likes: [LikesSchema],
    replies: [ReplySchema]
})

const EventSchema = mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: [true, 'Missing owner']
    },
    createdAt: {
        type: Date,
        default: new Date()
    },
    date: {
        type: Date,
        required: [true, 'Missing date']
    },
    title: {
        type: String,
        maxlength: 80,
        required: [true, 'Missing title']
    },
    text: {
        type: String,
        maxlength: 500,
        required: [true, 'Missing content']
    },
    pictures: {
        type: Array,
        of: {
            type: String,
            lowercase: true,
            validate: {
                validator: (value) => /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/.test(value),
                message: 'Invalid profile picture uri'
            },
        }
    },
    subscribers: {
        type: Array,
        of: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'users',
        }
    }
})

const GardenSchema = mongoose.Schema({
    coordinates: {
        latitude: {
            type: Number,
            required: [true, 'Missing latitude'],
            min: -90,
            max: 90,
        },
        longitude: {
            type: Number,
            required: [true, 'Missing longitude'],
            min: -180,
            max: 180,
        },
    },
    ppURI: {
        type: String,
        lowercase: true,
        validate: {
            validator: (value) => /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/.test(value),
            message: 'Invalid profile picture uri'
        },
        default: 'https://upload.wikimedia.org/wikipedia/commons/5/50/User_icon-cp.svg' // TODO : replace placeholder
    },
    name: {
        type: String,
        required: [true, 'Missing name']
    },
    description: {
        type: String,
        required: [true, 'Missing description'],
        maxlength: 300,
    },
    posts: [PostSchema],
    events: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'events'
    }],
    members: {
        type: Array,
        of: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'users'
        }
    },
    owners: {
        type: Array,
        of: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'users'
        },
        minlength: 1
    },
    filters: {
        interests: {
            type: Array,
            of: {
                type: String,
                enum: ['fruits', 'vegetables', 'flowers']
            }
        },
        bonus: {
            type: Array,
            of: {
                type: String,
                enum: ['dogs', 'water', 'a11y']
            }
        }
    }
})

const Garden = mongoose.model('gardens', GardenSchema)
module.exports = Garden
