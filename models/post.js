const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    owner: {type: String, required: true},
    garden: {type: String, required: true},
    text: {type: String, required: true},
    pictures: {type: [String], required: true},
    replies: {type: [Number], required: true},
    createdAt: {type: Date, default: Date.now},
    title: {type: String, required: true},
    likes: {type: [Object], required: true},
});

const Post = mongoose.model('Post', postSchema);
module.exports = Post;

