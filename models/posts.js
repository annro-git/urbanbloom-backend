const mongoose = require('mongoose');

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
});

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
    replies: [ReplySchema],
    createdAt: {
        type: Date,
        default: Date.now
    },
    title: {
        type: String,
        required: true
    },
    likes: [LikesSchema],
});

const Post = mongoose.model('Post', PostSchema);
module.exports = Post;

