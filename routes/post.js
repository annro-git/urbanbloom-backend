const express = require('express')
const router = express.Router()
const Post = require('../models/post')

router.post('/create', (req, res) => {

    const { owner, garden, text, pictures, replies, title, likes } = req.body

    const post = new Post({
        owner,
        garden,
        text,
        pictures,
        replies,
        createdAt: Date.now(),
        title,
        likes
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

router.put('/update/:owner/:title', (req, res) => {
    const { owner, title } = req.params
    Post.findOneAndUpdate({owner, title}, {likes: req.body.likes})
        .then(data => res.json({result: true, data}))
        .catch(error => res.json({message: error}))
});

router.put('update')
router.delete('/delete/:title', (req, res) => {
    Post.findOneAndDelete({title: req.params.title})
        .then(data => res.json({result: true, data}))
        .catch(error => res.json({message: error}))
});




module.exports = router