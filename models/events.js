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
    subscribers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
    }]
});

module.exports = mongoose.model('events', EventSchema);