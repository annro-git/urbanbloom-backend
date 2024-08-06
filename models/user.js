const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Missing username'],
        unique: true,
        lowercase: true,
        validate: {
            validator: (value) => /^[a-zA-Z0-9_]{3,16}$/.test(value),
            message: 'Invalid username'
        }
    },
    firstname: {
        type: String,
        required: [true, 'Missing firstname'],
        validate: {
            validator: (value) => /^[a-zA-Z]{1,16}$/.test(value),
            message: 'Invalid firstname'
        }
    },

    lastname: {
        type: String,
        required: [true, 'Missing lastname'],
        validate: {
            validator: (value) => /^[a-zA-Z]{1,16}$/.test(value),
            message: 'Invalid lastname'
        }
    },
    email: {
        type: String,
        required: [true, 'Missing email'],
        lowercase: true,
        validate: {
            validator: (value) => /\S+@\S+\.\S+/.test(value),
            message: 'Invalid email'
        }
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
        type: [Number],
        of: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'garden'
        }
    },
    posts: {
        type: [Number],
        of: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'post'
        }
    },
    events: {
        type: [Number],
        of: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'event'
        }
    },
    privacyMode: {
        type: Boolean,
        default: true,
    },
});

const User = mongoose.model('User', UserSchema);
module.exports = User;