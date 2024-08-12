const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
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
    subscribers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
    }]
});

module.exports = mongoose.model('events', EventSchema);