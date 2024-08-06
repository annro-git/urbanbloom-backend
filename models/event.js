const mongoose = require('mongoose');


const EventSchema = mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Missing title'],
    },
    description: {
        type: String,
        required: [true, 'Missing description'],
    },
    owner: {
        type: Number,
        of: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'users'
        }
    },
    garden: {
        type: Number,
        of: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'gardens'
        }
    },
    subscribers: {
        type: Array,
        of: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'users'
        }
    },
    date: {
        type: Date,
        required: [true, 'Missing date'],
    },
    createdAt: {
        type: Date,
        default: Date.now,
        required: [true, 'Missing creation date'],
    }
})