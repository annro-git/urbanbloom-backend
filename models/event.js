const mongoose = require('mongoose');


const EventSchema = mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Missing name'],
    },
    description: {
        type: String,
        required: [true, 'Missing description'],
    },
    owner: {
        type: Date,
        required: [true, 'Missing date'],
    },
    garden: {
        type: String,
        required: [true, 'Missing location'],
    },
    subscribers : {
        type: String,
        lowercase: true,
        validate: {
            validator: (value) => /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/.test(value),
            message: 'Invalid profile picture uri'
        },
        default: 'https://upload.wikimedia.org/wikipedia/commons/5/50/User_icon-cp.svg' // TODO : replace placeholder
    },
    date: {
        type: Array,
        of: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'users'
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})