const express = require('express')
const mongoose = require('mongoose')
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

// * Create an Event
router.post('/:gardenId/event/', async (req, res) => {
    const { gardenId } = req.params
    const { token, title, text, pictures, date } = req.body
    // Error 400 : Missing or empty field(s)
    if(!checkReq([gardenId, token, title, text, pictures, date], res)) return

    const garden = await Garden.findById(gardenId)
    // Error 404 : Not found
    if(!isFound('Garden', garden, res)) return

    const user = await User.findOne({ token })
    // Error 404 : Not found
    if(!isFound('User', user, res)) return
    // Error 403 : User is not a member
    if(!userCredential('members', user, garden, res)) return

    const newEvent = {
        _id: new mongoose.Types.ObjectId(),
        owner: user._id,
        title,
        text,
        pictures,
        date: Date(date),
        subscribers: [user._id],
    }

    garden.events.push(newEvent)

    try {
        await garden.save()
        user.events.push(newEvent._id)
        await user.save()
        res.status(201)
        res.json({ result: true, message: 'Event created'})
    } catch (error) {
        res.status(400)
        res.json({ result: false, error })
        return
    }

})

// * Get Garden Events
router.get('/:gardenId/events', async (req, res) => {
    const { gardenId } = req.params
    const { token } = req.headers
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

})

// * Update Garden Event Subscriber
router.put('/:gardenId/event/:eventId', async (req, res) => {
    const { gardenId, eventId } = req.params
    const { token, username } = req.body
    // Error 400 : Missing or empty field(s)
    if(!checkReq([gardenId, eventId, token, username], res)) return

    const garden = await Garden.findById(gardenId)
    // Error 404 : Not found
    if(!isFound('Garden', garden, res)) return

    const event = garden.events.find(event => String(event._id) === eventId)
    // Error 404 : Not found
    if(!event){
        res.status(404)
        res.json({ result: false, error: 'Event not found' })
        return
    }

    let user = await User.findOne({ token })
    // Error 404 : Not found
    if(!isFound('User', user, res)) return
    // Error 404 : Not allowed
    if(!userCredential('members', user, garden, res)) return

    let target = await User.findOne({ username })
    // Error 404 : Not found
    if(!isFound('User', target, res)) return
    // Error 404 : Not allowed
    if(!userCredential('members', target, garden, res)) return

    const save = async (message, add) => {
        try {
            await garden.save()
            if(!add){
                target.events = target.events.filter(e => String(e) !== String(event._id))
            } else {
                target.events.push(event)
            }
            await target.save()
            return { result: true, message }
        } catch (error) {
            return { result: false, error }
        }
    }
    if(JSON.stringify(user) !== JSON.stringify(target)){
        if(userCredential('owners', user, garden, res) || String(event.owner._id) === String(user._id)){
            // user is garden owner or event owner
            if(event.subscribers.find(subscriber => String(subscriber._id) === String(target._id))){
                // owners only allowed to remove
                event.subscribers = event.subscribers.filter(subscriber => String(subscriber._id) !== String(target._id))
                res.json(await save(`${target.username} removed`))
                return
            }
            res.status(404)
            res.json({ result: false, error: 'Subscriber not found' })
            return
        } else {
            res.status(400)
            res.json({ result: false, error: 'Must be garden or event owner'})
            return
        }
    }
    if(String(event.owner._id) === String(user._id)){
        res.status(400)
        res.json({ result: false, error: 'Owner can\'t leave his own event '})
        return
    }
    if(event.subscribers.find(subscriber => String(subscriber._id) === String(user._id))){
        event.subscribers = event.subscribers.filter(subscriber => String(subscriber._id) !== String(user._id))
        res.json(await save(`${user.username} has left`))
        return
    }
    event.subscribers.push(user._id)
    res.json(await save(`${target.username} has joined`))
})

// * Delete Garden Event
router.delete('/:gardenId/event/:eventId', async (req, res) => {
    const { gardenId, eventId } = req.params
    const { token } = req.body
    // Error 400 : Missing or empty field(s)
    if(!checkReq([gardenId, eventId, token], res)) return

    let garden = await Garden.findById(gardenId)
    // Error 404 : Not found
    if(!isFound('Garden', garden, res)) return

    const event = garden.events.find(event => String(event._id) === eventId)
    // Error 404 : Not found
    if(!event){
        res.status(404)
        res.json({ result: false, error: 'Event not found' })
        return
    }

    let user = await User.findOne({ token })
    // Error 404 : Not found
    if(!isFound('User', user, res)) return

    if(String(event.owner._id) !== String(user._id)){
        // Error 403 : Not allowed
        if(!userCredential('owners', user, garden, res)) return
    }

    const removeFromUserEvents = async () => {
        garden.populate('events.subscribers')
        const { subscribers } = event
        subscribers.forEach(async (subscriber) => {
            let currentSubscriber = await User.findById(subscriber)
            currentSubscriber.events = currentSubscriber.events.filter(event => String(event) !== eventId)
            await currentSubscriber.save()
        })
        return
    }

    garden.events = garden.events.filter(e => String(e._id) !== String(eventId))

    try {
        await garden.save()
        await removeFromUserEvents()
        res.json({ result: true, message: 'Event deleted' })
    } catch (error) {
        res.json({ result: false, error: String(error) })
    }

})

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
    if(!isFound('User', owner, res)) return
    // Error 403 : Not owner
    if(!userCredential('owners', owner, garden, res)) return

    const user = await User.findOne({ username })
    // Error 404 : Not found
    if(!isFound('User', user, res)) return
    // Error 403 : Not member
    if(!userCredential('members', user, garden, res)) return

    const save = async(message) => {
        try {
            await garden.save()
            return { result: true, message }
        } catch (error) {
            return { result: false, error }
        }
    }
    if(JSON.stringify(owner) !== JSON.stringify(user)){
        if(!garden.owners.find(owner => String(owner) === String(user._id))){
            // user is not Owner
            garden.owners.push(user)
            res.json(await save(`${ username } added to ${ garden.name } owners`))
            return
        }
        // user is Owner
        garden.owners = garden.owners.filter(owner => String(owner) !== String(user._id))
        res.json(await save(`${ username } removed from ${ garden.name } owners`))
        return
    }
    // owner === user
    if(garden.owners.length > 1){
        // owner is not the last Owner
        garden.owners = garden.owners.filter(owner => String(owner) !== String(user._id))
        res.json(await save(`${ username } revoked is owner status`))
        return
    }
    // Error 403 : owner is the last Owner
    res.status(403)
    res.json({ result: false, error: 'Last owner can\'t revoke his status' })
})

// * Update Garden Member
router.put('/:gardenId/member', async (req,res) => {
    const { gardenId } = req.params
    const { token, username } = req.body
    // Error 400 : Missing or empty field(s)
    if(!checkReq([gardenId, token, username], res)) return

    const garden = await Garden.findById(gardenId)
    // Error 404 : Not found
    if(!isFound('Garden', garden, res)) return

    let user = await User.findOne({ token })
    // Error 404 : Not found
    if(!isFound('User', user, res)) return

    let target = await User.findOne({ username })
    // Error 404 : Not found
    if(!isFound('User', target, res)) return

    const save = async (message, add) => {
        try {
            await garden.save()
            if(!add){
                target.gardens = target.gardens.filter(e => String(e) !== String(garden._id))
            } else {
                target.gardens.push(garden)
            }
            await target.save()
            return { result: true, message }
        } catch (error) {
            return { result: false, error }
        }
    }

    if(JSON.stringify(user) !== JSON.stringify(target)){
        // Error 403 : user must be owner to act
        if(!userCredential('owners', user, garden, res)) return
        // Error 403 : owner only allowed to remove
        if(garden.members.some(member => String(member) === String(target._id))){
            garden.members = garden.members.filter(member => String(member) !== String(target._id))
            res.status(200)
            res.json(await save(`${target.username} removed`), false)
            return
        }
        res.status(403)
        res.json({ result: false, error: 'Owner can\'t add member'})
        return
    }
    if(!garden.owners.some(owner => String(owner) === String(user._id))){
        if(!garden.members.some(member => String(member) === String(user._id))){
            garden.members.push(target)
            res.status(200)
            res.json(await save(`${target.username} has joined`), true)
            return
        }
        garden.members = garden.members.filter(member => String(member) !== String(user._id))
        res.status(200)
        res.json(await save(`${target.username} has left`), false)
        return
    }
    res.status(403)
    res.json({ result: false, error: 'Owners are members'})

})

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