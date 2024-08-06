const mongoose = require('mongoose')

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
    posts: {
        type: Array,
        of: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'posts'
        }
    },
    events: {
        type: Array,
        of: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'events'
        }
    },
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
        interest: {
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