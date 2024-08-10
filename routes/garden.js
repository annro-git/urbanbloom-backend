const express = require('express')
const User = require('../models/users')
const Garden = require('../models/gardens')
const router = express.Router()

const { checkReq, isFound, isMember } = require('../helpers/errorHandlers')

const strToArr = (str) => str.replace(/\[|\]|\'|\"/g, '').split(',').map(e => e.trim())

// * Create a Garden
router.post('/', async (req, res) => {
    const { latitude, longitude, name, description, token, interests, bonus } = req.body
    // Error 400 : Missing or empty field(s)
    if (!checkReq([latitude, longitude, name, description, token, interests, bonus], res)) return

    const user = await User.findOne({ token })
    // Error 404 : Not found
    if (!isFound('User', user, res)) return

    const owners = [user]
    const members = [user]
    const coordinates = { latitude, longitude }
    const filters = { interests: strToArr(interests), bonus: strToArr(bonus) }

    const newGarden = new Garden({
        coordinates,
        name,
        description,
        owners,
        members,
        filters,
    })

    try {
        const response = await newGarden.save()
        if (!response) {
            res.status(400)
            res.json({ result: false, error: 'Failing to create new garden' })
        }
        await User.updateOne({ token }, { $push: { gardens: response._id } }) // add garden to user garden list
        res.status(201)
        res.json({ result: true, message: `Garden ${name} created and added to ${user.username} gardens` })

    } catch (error) {
        res.status(400)
        res.json({ result: false, error })
        return
    }

})

// * Create a Post
router.post('/:gardenId/post/', async (req, res) => {
    const { gardenId } = req.params
    const { token, title, text, pictures } = req.body
    // Error 400 : Missing or empty field(s)
    if (!checkReq([gardenId, token, title, text, pictures], res)) return

    const garden = await Garden.findById(gardenId)
    // Error 404 : Not found
    if (!isFound('Garden', garden, res)) return

    const user = await User.findOne({ token })
    // Error 404 : Not found
    if (!isFound('User', user, res)) return

    const member = await Garden.findOne({ members: user._id })
    // Error 403 : User is not a member
    if (!isMember(member, res)) return

    const newPost = {
        owner: user._id,
        title,
        text,
        pictures,
    }

    try {
        await Garden.updateOne({ _id: gardenId }, { $push: { posts: newPost } })
        res.status(201)
        res.json({ result: true, message: 'Post created' })
    } catch (error) {
        res.status(400)
        res.json({ result: false, error })
        return
    }

})

// * Get Garden Posts
router.get('/:gardenId/posts', async (req, res) => {
    const { gardenId } = req.params
    const { token } = req.headers
    // Error 400 : Missing or empty field(s)
    if (!checkReq([gardenId, token], res)) return

    const garden = await Garden.findById(gardenId)
    // Error 404 : Not found
    if (!isFound('Garden', garden, res)) return

    const user = await User.findOne({ token })
    // Error 404 : Not found
    if (!isFound('User', user, res)) return

    const member = await Garden.findOne({ members: user._id })
    // Error 403 : User is not a member
    if (!isMember(member, res)) return

    // Filter user ids
    await garden.populate('posts.owner', ['username', '-_id'])

    const posts = garden.posts.map(post => {
        return ({
            owner: post.owner.username,
            createdAt: post.createdAt,
            title: post.title,
            test: post.text,
            repliesCount: post.replies.length,
            likes: post.likes.map(like => {
                return ({
                    type: like.likeType,
                    likeCount: like.owner.length
                })
            })
        })
    })

    res.json({ result: true, posts })

})

// * Create Post Reply
router.post('/:gardenId/post/:postId', async (req, res) => {
    const { gardenId, postId } = req.params
    const { token, text } = req.body
    // Error 400 : Missing or empty field(s)
    if (!checkReq([gardenId, postId, token, text], res)) return

    const garden = await Garden.findById(gardenId)
    // Error 404 : Not found
    if (!isFound('Garden', garden, res)) return

    const post = garden.posts.find(e => String(e._id) === postId)
    // Error 404 : Not found
    if (!isFound('Post', post, res)) return

    const user = await User.findOne({ token })
    // Error 404 : Not found
    if (!isFound('User', user, res)) return

    const member = await Garden.findOne({ members: user._id })
    // Error 403 : User is not a member
    if (!isMember(member, res)) return

    const newReply = {
        owner: member._id,
        text,
        date: new Date(),
    }
    try {
        post.replies.push(newReply)
        await garden.save()
        res.json({ result: true, message: `Reply added to post ${postId}` })
    } catch (error) {
        res.status(400)
        res.json({ result: false, error })
        return
    }


    //En utilisant updateOne permet d'alléger la mémoire en ne récupérant pas tout le document
    /* try {
        const updateResult = await Garden.updateOne(
            { _id: gardenId, 'posts._id': postId },
            { $push: { 'posts.$.replies': newReply } }
        );

        if (updateResult.nModified === 0) {
            res.status(400).json({ result: false, message: 'Failed to add reply' });
            return;
        }

        res.json({ result: true, message: `Reply added to post ${postId}` });
    } catch (error) {
        res.status(400).json({ result: false, error });
    } */

})

// * Get Garden Post Replies
router.get('/:gardenId/post/:postId', async (req, res) => {
    const { gardenId, postId } = req.params
    const { token } = req.body
    // Error 400 : Missing or empty field(s)
    if (!checkReq([gardenId, postId, token], res)) return

    const garden = await Garden.findById(gardenId)
    // Error 404 : Not found
    if (!isFound('Garden', garden, res)) return

    const post = garden.posts.find(e => String(e._id) === postId)
    // Error 404 : Not found
    if (!isFound('Post', post, res)) return

    const user = await User.findOne({ token })
    // Error 404 : Not found
    if (!isFound('User', user, res)) return

    const member = await Garden.findOne({ members: user._id })
    // Error 403 : User is not a member
    if (!isMember(member, res)) return

    res.json({ result: true, replies: post.replies })

})

// * Update Garden Post Like
router.put('/:gardenId/post/:postId/like', async (req, res) => {
    const { gardenId, postId } = req.params
    const { token, likeType } = req.body
    // Error 400 : Missing or empty field(s)
    if (!checkReq([gardenId, postId, token, likeType], res)) return

    const garden = await Garden.findById(gardenId)
    // Error 404 : Not found
    if (!isFound('Garden', garden, res)) return

    const post = garden.posts.find(e => String(e._id) === postId)
    // Error 404 : Not found
    if (!isFound('Post', post, res)) return

    const user = await User.findOne({ token })
    // Error 404 : Not found
    if (!isFound('User', user, res)) return

    const member = await Garden.findOne({ members: user._id })
    // Error 403 : User is not a member
    if (!isMember(member, res)) return

    const like = post.likes.find(like => String(like.owner) === String(user._id))
    const save = async (verb) => {
        try {
            await garden.save()
            return { result: true, message: `Like ${verb}` }
        } catch (error) {
            return { result: false, error }
        }
    }
    if (!like) {
        const newLike = {
            owner: user._id,
            likeType
        }
        post.likes.push(newLike)
        res.json(await save('added'))
        return
    }
    if (like.likeType === likeType) {
        post.likes = post.likes.filter(like => String(like.owner) !== String(user._id))
        res.json(await save('deleted'))
    }
    like.likeType = likeType
    res.json(await save('updated'))

})

// * Create an Event
router.post('/:gardenId/event/', async (req, res) => {
    const { gardenId } = req.params
    const { token, title, text, pictures, date } = req.body
    // Error 400 : Missing or empty field(s)
    if (!checkReq([gardenId, token, title, text, pictures, date], res)) return

    const garden = await Garden.findById(gardenId)
    // Error 404 : Not found
    if (!isFound('Garden', garden, res)) return

    const user = await User.findOne({ token })
    // Error 404 : Not found
    if (!isFound('User', user, res)) return

    const member = await Garden.findOne({ members: user._id })
    // Error 403 : User is not a member
    if (!isMember(member, res)) return

    const newEvent = {
        owner: member._id,
        title,
        text,
        pictures,
        date: new Date(),
    }
    try {
        await Garden.updateOne({ _id: gardenId }, { $push: { events: newEvent } })
        res.status(201)
        res.json({ result: true, message: 'Event created' })
    } catch (error) {
        res.status(400)
        res.json({ result: false, error })
        return
    }

})

// * Get Garden Events
router.get('/:gardenId/events', async (req, res) => {
    const { gardenId } = req.params
    const { token } = req.body
    // Error 400 : Missing or empty field(s)
    if (!checkReq([gardenId, token], res)) return

    const garden = await Garden.findById(gardenId)
    // Error 404 : Not found
    if (!isFound('Garden', garden, res)) return

    const user = await User.findOne({ token })
    // Error 404 : Not found
    if (!isFound('User', user, res)) return

    const member = await Garden.findOne({ members: user._id })
    // Error 403 : User is not a member
    if (!isMember(member, res)) return

    res.json({ result: true, events: garden.events })

})



router.get('/:gardenId/filters', async (req, res) => {
    const { gardenId } = req.params;

    // Vérifie si l'ID est un ObjectId valide
    if (!mongoose.Types.ObjectId.isValid(gardenId)) {
        return res.status(404).json({
            result: false,
            message: 'Jardin non trouvé.'
        });
    }

    try {
        // Votre logique de recherche de jardin ici
        const garden = await Garden.findById(gardenId);
        if (!garden) {
            return res.status(404).json({
                result: false,
                message: 'Jardin non trouvé.'
            });
        }

        // Retourne les filtres du jardin
        res.status(200).json({
            result: true,
            data: {
                interests: garden.interests,
                bonus: garden.bonus
            }
        });
    } catch (error) {
        // Capture les erreurs internes du serveur
        res.status(500).json({
            result: false,
            message: 'Erreur interne du serveur.'
        });
    }
});

// * Update Garden Owner
router.put('/:gardenId/owner', async (req, res) => {
    const { gardenId } = req.params
    const { token, username } = req.body
    // Error 400 : Missing or empty field(s)
    if (!checkReq([gardenId, token], res)) return

    const garden = await Garden.findById(gardenId)
    // Error 404 : Not found
    if (!isFound('Garden', garden, res)) return

    const user = await User.findOne({ token })
    // Error 404 : Not found
    if (!isFound('User', user, res)) return
    // Error 403 : User is not an owner
    if (!garden.owners.find(owner => String(owner) === String(user._id))) {
        res.status(403)
        res.json({ result: false, error: 'User is not an owner' })
    }
})

// * Delete Garden Member

module.exports = router