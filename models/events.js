const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    hour: {
        type: String,
        required: true,
        validate: {
            validator: function (v) {
                return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
            },
            message: props => `${props.value} is not a valid hour format! Expected format is hh:mm.`
        }
    },
    location: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: new Date()
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
    garden: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'gardens',
        required: true
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    subscribers: {
        type: Array,
        of: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'users',
        }
    }
});

module.exports = mongoose.model('events', EventSchema);