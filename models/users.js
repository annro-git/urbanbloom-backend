const mongoose = require('mongoose')

const UserSchema = mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Missing email'],
        lowercase: true,
        validate: {
            validator: (value) => /\S+@\S+\.\S+/.test(value),
            message: 'Invalid email'
        }
    },
    username: {
        type: String,
        required: [true, 'Missing username'],
        lowercase: true,
    },
    password: {
        type: String,
        required: [true, 'Missing password']
    },
    token: {
        type: String,
        required: [true, 'Missing token'],
        minlength: 32,
        maxlength: 32
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
    gardens: {
        type: Array,
        of: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'gardens'
        }
    },
    events: {
        type: Array,
        of: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'events'
        }
    },
    bio: {
        type: String,
    },
    privacy: {
        type: Boolean,
        default: true,
    },
    isAdmin: {
        type: Boolean,
        default: false,
    },
    firstname: String,
    lastname: String,
})

const User = mongoose.model('users', UserSchema)
module.exports = User