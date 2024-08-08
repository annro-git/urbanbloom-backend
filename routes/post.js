const express = require('express')
const router = express.Router()
const Post = require('../models/posts')

router.post('/create', async (req, res) => {
    try {
        const { owner, garden, text, pictures, replies, title, likes } = req.body

        // Vérifier si le post existe déjà
        const existingPost = await Post.findOne({ owner, garden, title })
        if (existingPost) {
            res.status(400).json({ result: false, message: 'Post already exists' })
            return
        }

        // Créer un nouveau post
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

        const data = await post.save()
        res.status(201).json({ result: true, data })
    } catch (error) {
        res.status(500).json({ result: false, message: error.message })
    }
})

router.get('/all', (req, res) => {
    Post.find()
        .then(data => res.json({ result: true, data }))
        .catch(error => res.json({ message: error }))
});

router.get('/search/:owner', (req, res) => {
    Post.find(req.params.owner)
        .then(data => res.json({ result: true, data }))
        .catch(error => res.json({ message: error }))
});

router.get('/search/:title', (req, res) => {
    Post.find({ title: req.params.title })
        .then(data => res.json({ result: true, data }))
        .catch(error => res.json({ message: error }))
});

router.put('/update/:owner/:title', (req, res) => {
    const { owner, title } = req.params
    Post.findOneAndUpdate({ owner, title }, { likes: req.body.likes })
        .then(data => res.json({ result: true, data }))
        .catch(error => res.json({ message: error }))
});

router.delete('/delete/:title', (req, res) => {
    Post.findOneAndDelete({ title: req.params.title })
        .then(data => res.json({ result: true, data }))
        .catch(error => res.json({ message: error }))
});


module.exports = router
