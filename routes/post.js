const express = require('express')
const router = express.Router()
const Post = require('../models/post')

router.post('/create', (req, res) => {
    const post = new Post({
        owner: req.body.owner,
        garden: req.body.garden,
        text: req.body.text,
        pictures: req.body.pictures,
        replies: req.body.replies,
        title: req.body.title,
        likes: req.body.likes
    })
    post.save()
        .then(data => res.json({result: true, data}))
        .catch(error => res.json({message: error}))
});

router.get('/all', (req, res) => {
    Post.find()
        .then(data => res.json({result: true, data}))
        .catch(error => res.json({message: error}))
});

router.get('/search/:owner', (req, res) => {
    Post.find(req.params.owner)
        .then(data => res.json({result: true, data}))
        .catch(error => res.json({message: error}))
});

router.get('/search/:title', (req, res) => {
    Post.find({title: req.params.title})
        .then(data => res.json({result: true, data}))
        .catch(error => res.json({message: error}))
});

router.put('/update/:owner', (req, res) => {
    Post.findByIdAndUpdate(req.params.owner, {likes: req.body.likes})
        .then(data => res.json({result: true, data}))
        .catch(error => res.json({message: error}))
});

router.delete('/delete/:title', (req, res) => {
    Post.findOneAndDelete({title: req.params.title})
        .then(data => res.json({result: true, data}))
        .catch(error => res.json({message: error}))
});




module.exports = router