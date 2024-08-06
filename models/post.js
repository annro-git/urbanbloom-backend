const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
    owner: {
        type: String,
        of: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'users'
        }
    },
    garden: {
        type: String,
        of: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'gardens'
        }
    },
    text: {
        type: String,
        required: true
    },
    pictures: {
        type: [String],
        default: []
    },
    replies: {
        type: [Number],
        of: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'replies'
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    title: {
        type: String,
        required: true
    },
    likes: {
        type: [Object],
        required: true
    },
});

const Post = mongoose.model('Post', PostSchema);
module.exports = Post;

