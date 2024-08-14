const express = require('express')
const User = require('../models/users')
const Garden = require('../models/gardens')
const Event = require('../models/events')
const router = express.Router();
const bcrypt = require('bcrypt')


const { checkReq, isFound, userCredential, isMember } = require('../helpers/errorHandlers')
const { parseLikes } = require('../helpers/parseLikes')


const strToArr = (str) => str.replace(/\[|\]|\'|\"/g, '').split(',').map(e => e.trim())

// * Create a Garden
router.post('/', async (req, res) => {
    const { latitude, longitude, name, description, interests, bonus } = req.body;
    const { token } = req.headers;
    // Error 400 : Missing or empty field(s)
    if (!checkReq([latitude, longitude, name, description, token, interests, bonus], res)) return;

    const user = await User.findOne({ token });
    // Error 404 : Not found
    if (!isFound('User', user, res)) return;

    const allowedInterests = ['fruits', 'vegetables', 'flowers'];
    const allowedBonuses = ['dogs', 'water', 'a11y'];

    function validateInterests(providedInterests) {
        if (!Array.isArray(providedInterests)) return false;
        return providedInterests.every(interest => allowedInterests.includes(interest));
    }

    function validateBonuses(providedBonuses) {
        if (!Array.isArray(providedBonuses)) return false;
        return providedBonuses.every(bonus => allowedBonuses.includes(bonus));
    }

    if (!validateInterests(interests)) {
        res.status(400).json({ result: false, error: 'Invalid interests' });
        return;
    }

    if (!validateBonuses(bonus)) {
        res.status(400).json({ result: false, error: 'Invalid bonuses' });
        return;
    }

    const owner = user;
    const members = [user];
    const coordinates = { latitude, longitude };
    const filters = { interests, bonus };

    const newGarden = new Garden({
        coordinates,
        name,
        description,
        owner,
        members,
        filters,
    });

    try {
        const response = await newGarden.save();
        if (!response) {
            res.status(400).json({ result: false, error: 'Failing to create new garden' });
            return;
        }
        await User.updateOne({ token }, { $push: { gardens: response._id } }); // add garden to user garden list
        res.status(201).json({ result: true, message: `Garden ${name} created and added to ${user.username} gardens` });

    } catch (error) {
        res.status(400).json({ result: false, error });
    }
});


// * Create a Post
router.post('/:gardenId/post', async (req, res) => {
    const { gardenId } = req.params
    const { title, text, pictures } = req.body
    const { token } = req.headers
    // Error 400 : Missing or empty field(s)
    if (!checkReq([gardenId, token, title, text, pictures], res)) return

    const garden = await Garden.findById(gardenId)
    // Error 404 : Not found
    if (!isFound('Garden', garden, res)) return

    const user = await User.findOne({ token })
    // Error 404 : Not found
    if (!isFound('User', user, res)) return
    // Error 403 : User is not a member
    if (!userCredential('members', user, garden, res)) return

    const newPost = {
        owner: user._id,
        title,
        text,
        pictures,
    }

    try {
        await garden.save()
        await Garden.updateOne({ _id: gardenId }, { $push: { posts: newPost } })
        res.status(201)
        res.json({ result: true, message: 'Post created' })
    } catch (error) {
        res.status(400)
        res.json({ result: false, error })
        return
    }

})

// * Get Garden's Posts
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
    if (!isFound('User', user, res)) return

    const member = await Garden.findOne({ members: user._id })
    // Error 403 : User is not a member
    if (!userCredential('members', user, garden, res)) return

    // Filter user ids
    await garden.populate('posts.owner', ['username', '-_id'])
    await garden.populate('posts.likes.owner', ['username', '-_id'])

    // Parse posts likes
    const parseLikes = (likes) => {
        const result = {}
        likes.forEach(like => {
            if (!result[like.likeType]) {
                result[like.likeType] = []
                result[like.likeType].push(like.owner.username)
                return
            }
            result[like.likeType].push(like.owner.username)
        })
        return result
    }

    const posts = garden.posts.map(post => {
        return ({
            owner: post.owner.username,
            createdAt: post.createdAt,
            title: post.title,
            text: post.text,
            repliesCount: post.replies.length,
            likes: parseLikes(post.likes)
        })
    })

    res.json({ result: true, posts })

})

// * Get one Garden's Post
router.get('/:gardenId/post/:postId', async (req, res) => {
    const { gardenId, postId } = req.params
    const { token } = req.headers
    // Error 400 : Missing or empty field(s)
    if (!checkReq([gardenId, postId, token], res)) return

    const garden = await Garden.findById(gardenId)
    // Error 404 : Not found
    if (!isFound('Garden', garden, res)) return

    let post = garden.posts.find(e => String(e._id) === String(postId))
    // Error 404 : Not found
    if (!isFound('Post', post, res)) return

    const user = await User.findOne({ token })
    // Error 404 : Not found
    if (!isFound('User', user, res)) return
    // Error 403 : User is not a member
    if (!userCredential('members', user, garden, res)) return

    await garden.populate('posts.owner', ['username', '-_id'])
    await garden.populate('posts.replies.owner', ['username', '-_id'])
    await garden.populate('posts.likes.owner', ['username', '-_id'])

    post = {
        owner: post.owner.username,
        createdAt: post.createdAt,
        title: post.title,
        text: post.text,
        pictures: post.pictures,
        replies: post.replies.map(reply => {
            return ({
                owner: reply.owner.username,
                createdAt: reply.createdAt,
                text: reply.text,
            })
        }),
        likes: parseLikes(post.likes)
    }

    res.json({ result: true, post })

})

// * Create Post's Reply
router.post('/:gardenId/post/:postId', async (req, res) => {
    const { gardenId, postId } = req.params
    const { text } = req.body
    const { token } = req.headers
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
    // Error 403 : User is not a member
    if (!userCredential('members', user, garden, res)) return

    const newReply = {
        owner: user._id,
        text,
        createdAt: Date.now()
    }
    /* try {
        post.replies.push(newReply)
        await garden.save()
        res.json({ result: true, message: `Reply added to post ${postId}` })
    } catch (error) {
        res.status(400)
        res.json({ result: false, error })
        return
    } */


    //En utilisant updateOne permet d'alléger la mémoire en ne récupérant pas tout le document

    try {
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
    }

})

// * Get Post's Replies
router.get('/:gardenId/post/:postId', async (req, res) => {
    const { gardenId, postId } = req.params
    const { token } = req.headers
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
    if (!isFound('User', user, res)) return

    const member = await Garden.findOne({ members: user._id })
    // Error 403 : User is not a member
    if (!userCredential('members', user, garden, res)) return

    await garden.populate(`posts.replies.owner`)

    const replies = post.replies.map(reply => {
        return ({
            owner: reply.owner.username,
            createdAt: reply.createdAt,
            text: reply.text,
        })
    })
    if (!isMember(member, res)) return

    res.json({ result: true, replies })

});

// * Update Garden Post Like
router.put('/:gardenId/post/:postId/like', async (req, res) => {
    const { gardenId, postId } = req.params
    const { likeType } = req.body
    const { token } = req.headers
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
    if (!isFound('User', user, res)) return

    const member = await Garden.findOne({ members: user._id })
    // Error 403 : User is not a member
    if (!userCredential('members', user, garden, res)) return
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









// 13/08/2024

/* // * Get Garden Events
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
    if(!isFound('User', user, res)) return
    if (!isFound('User', user, res)) return

    const member = await Garden.findOne({ members: user._id })
    // Error 403 : User is not a member
    if(!userCredential('members', user, garden, res)) return
    if (!isMember(member, res)) return

    res.json({ result: true, events: garden.events })

}); */

// * Get Garden Events
router.get('/:gardenId/events', async (req, res) => {
    const { gardenId } = req.params;
    const { token } = req.headers;

    // Error 400 : Missing or empty field(s)
    if (!checkReq([gardenId, token], res)) return;

    const garden = await Garden.findById(gardenId);
    // Error 404 : Not found
    if (!isFound('Garden', garden, res)) return;

    const user = await User.findOne({ token });
    // Error 404 : Not found
    if (!isFound('User', user, res)) return;

    // Error 403 : User is not a member
    if (!userCredential('members', user, garden, res)) return;

    const populatedGarden = await garden.populate({
        path: 'events',
        populate: {
            path: 'creator',
            select: 'username ppURI'
        }
    })
    const events = populatedGarden.events

    res.json({ result: true, events });
});


// * Get Garden Filters
router.get('/:gardenId/filters', async (req, res) => {
    const { gardenId } = req.params;
    const { token } = req.headers;

    // Error 400 : Missing or empty field(s)
    if (!checkReq([gardenId, token], res)) return;

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
            filters: {
                interests: garden.filters.interests,
                bonus: garden.filters.bonus
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

// * Delete Garden
router.delete('/:gardenId', async (req, res) => {
    const { gardenId } = req.params;
    const { token } = req.headers;
    const { password } = req.body;  

    // Error 400 : Missing or empty field(s)
    if (!checkReq([gardenId, token, password], res)) return;

    const garden = await Garden.findById(gardenId);
    // Error 404 : Not found
    if (!isFound('Garden', garden, res)) return;

    const user = await User.findOne({ token });
    // Error 404 : Not found
    if (!isFound('User', user, res)) return;

    if (!bcrypt.compareSync(password, user.password)) {
        res.status(403);
        return res.json({ result: false, error: 'Wrong password' });
    }

    // Error 403 : User is not an owner
    if (String(garden.owner) !== String(user._id)) {
        res.status(403);
        return res.json({ result: false, error: 'User is not an owner' });
    }

    // Update members
    await garden.populate('members');
    const { members } = garden;
    for (const member of members) {
        await User.findOneAndUpdate({ _id: member._id }, { $pullAll: { gardens: [garden._id] } });
    }

    // Suppression des événements associés au jardin
    const events = await Event.find({ garden: gardenId });
    for (const event of events) {
        // Supprimer l'événement de la liste des événements créés et abonnés des utilisateurs
        await User.updateMany(
            { $or: [{ createdEvents: event._id }, { subscribedEvents: event._id }] },
            { $pull: { createdEvents: event._id, subscribedEvents: event._id } }
        );
        // Supprimer l'événement lui-même
        await Event.deleteOne({ _id: event._id });
    }

    // Delete garden
    try {
        await Garden.deleteOne({ _id: garden._id });
        res.status(200);
        res.json({ result: true, message: 'Garden and associated events deleted' });
    } catch (error) {
        res.status(400);
        res.json({ result: false, error });
    }
});



// * Delete Garden Member
router.delete('/:gardenId/member', async (req, res) => {
    const { gardenId } = req.params;
    const { token } = req.headers;

    // Error 400 : Missing or empty field(s)
    if (!checkReq([gardenId, token], res)) return;

    const garden = await Garden.findById(gardenId);
    // Error 404 : Not found
    if (!isFound('Garden', garden, res)) return;

    const user = await User.findOne({ token });
    // Error 404 : Not found
    if (!isFound('User', user, res)) return;

    // Error 403 : User is not a member
    if (!garden.members.find(member => String(member) === String(user._id))) {
        res.status(403);
        return res.json({ result: false, error: 'User is not a member' });
    }

    // Update members
    await User.findOneAndUpdate({ _id: user._id }, { $pullAll: { gardens: [garden._id] } });
    await Garden.findOneAndUpdate({ _id: garden._id }, { $pullAll: { members: [user._id] } });

    res.status(200);
    res.json({ result: true, message: 'Member deleted' });
});



// * Update Garden's Members
router.put('/:gardenId/member/', async (req, res) => {
    const { gardenId } = req.params;
    const { token } = req.headers;

    // Error 400 : Missing or empty field(s)
    if (!checkReq([gardenId, token], res)) return;

    const garden = await Garden.findById(gardenId);
    // Error 404 : Not found
    if (!isFound('Garden', garden, res)) return;

    const user = await User.findOne({ token });
    // Error 404 : Not found
    if (!isFound('User', user, res)) return;

    // Error 403 : User is not a member
    if (!garden.members.find(member => String(member) === String(user._id))) {
        res.status(403);
        return res.json({ result: false, error: 'User is not a member' });
    }

    // Update members
    await User.findOneAndUpdate({ _id: user._id }, { $pullAll: { gardens: [garden._id] } });
    await Garden.findOneAndUpdate({ _id: garden._id }, { $pullAll: { members: [user._id] } });

    res.status(200);
    res.json({ result: true, message: 'Member deleted' });
});

module.exports = router