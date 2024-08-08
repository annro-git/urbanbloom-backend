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
});


router.get('/all', async (req, res) => {
    try {
        const posts = await Post.find()

        res.status(200).json({
            result: true,
            data: posts
        });
    } catch (error) {
        res.status(500).json({ result: false, message: error.message });
    }
});

router.put('/update/likes/:owner/:title', async (req, res) => {
    try {
        const { token, likes } = req.body;
        const { owner, title } = req.params;

        if (!token || token.trim() === '') {
            return res.status(403).json({ result: false, message: 'Token invalide.' });
        }

        const user = await User.findOne({ token });

        if (!user || user.username !== owner) {
            return res.status(403).json({ result: false, message: 'Propriétaire non trouvé ou token invalide.' });
        }

        if (typeof likes !== 'number') {
            return res.status(400).json({ result: false, message: 'Les likes doivent être un nombre.' });
        }

        const updatedPost = await Post.findOneAndUpdate({ owner, title }, { likes }, { new: true });

        if (!updatedPost) {
            return res.status(404).json({ result: false, message: 'Post non trouvé.' });
        }

        res.status(200).json({ result: true, data: updatedPost });
    } catch (error) {
        res.status(500).json({ result: false, message: error.message });
    }
});// 08/08/2024


router.put('/update/replies/:owner/:title', async (req, res) => {
    try {
        const { token } = req.body;
        const { owner, title } = req.params;
        const { replies } = req.body;

        if (!token || token.trim() === '') {
            res.status(403).json({ result: false, message: 'Token invalide.' });
            return;
        }

        const updatedPost = await Post.findOneAndUpdate({ owner, title }, { $push: { replies } }, { new: true });

        if (!updatedPost) {
            res.status(404).json({ result: false, message: 'Post not found' });
            return;
        }

        res.status(200).json({ result: true, data: updatedPost });
    } catch (error) {
        res.status(500).json({ result: false, message: error.message });
    }
}); //08/08/2024



router.get('/posts/:owner', async (req, res) => {
    try {
        const { token } = req.body;
        const { owner } = req.params;
        const posts = await Post.find({ owner });

        if (!token || token.trim() === '') {
            return res.status(403).json({ result: false, message: 'Token invalide.' });
        }

        if (!posts.length) {
            return res.status(404).json({ result: false, message: 'Aucun post trouvé pour ce propriétaire.' });
        }

        res.status(200).json({ result: true, data: posts });
    } catch (error) {
        res.status(500).json({ result: false, message: error.message });
    }
}); // 08/08/2024


router.get('/posts/:owner', async (req, res) => {
    try {
        const { owner } = req.params;
        const { token } = req.body;
        const posts = await Post.find({ owner });

        if (!token || token.trim() === '') {
            return res.status(403).json({ result: false, message: 'Token invalide.' });
        }

        if (!posts.length) {
            return res.status(404).json({ result: false, message: 'Aucun post trouvé pour ce propriétaire.' });
        }

        res.status(200).json({ result: true, data: posts });
    } catch (error) {
        res.status(500).json({ result: false, message: error.message });
    }
}); // 08/08/2024


router.delete('/post/:owner/:title/:token', async (req, res) => {
    try {
        const { owner, title, token } = req.params;

        // Vérifiez que le token existe
        if (!token || token.trim() === '') {
            return res.status(403).json({ result: false, message: 'Token invalide.' });
        }

        const deletedPost = await Post.findOneAndDelete({ owner, title });

        if (!deletedPost) {
            return res.status(404).json({ result: false, message: 'Post non trouvé.' });
        }

        res.status(200).json({ result: true, data: deletedPost });
    } catch (error) {
        res.status(500).json({ result: false, message: error.message });
    }
}); // 08/08/2024


module.exports = router
