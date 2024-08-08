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
    if(!checkReq([latitude, longitude, name, description, token, interests, bonus], res)) return

    const user = await User.findOne({ token })
    // Error 404 : Not found
    if(!isFound('User', user, res)) return

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
        if(!response){
            res.status(400)
            res.json({ result: false, error: 'Failing to create new garden'})
        }
        await User.updateOne({ token }, { $push: { gardens: response._id} }) // add garden to user garden list
        res.status(201)
        res.json({ result: true, message: `Garden ${name} created and added to ${user._id} gardens` })
        
    } catch (error) {
        res.status(400)
        res.json({ result: false, error})
        return
    }

})

// * Create a Post
router.post('/:gardenId/post/', async (req, res) => {
    const { gardenId } = req.params
    const { token, title, text, pictures } = req.body
    // Error 400 : Missing or empty field(s)
    if(!checkReq([gardenId, token, title, text, pictures], res)) return

    const garden = await Garden.findById(gardenId)
    // Error 404 : Not found
    if(!isFound('Garden', garden, res)) return

    const user = await User.findOne({ token })
    // Error 404 : Not found
    if(!isFound('User', user, res)) return

    const member = await Garden.findOne({ members: user._id })
    // Error 403 : User is not a member
    if(!isMember(member, res)) return

    const newPost = {
        owner: user._id,
        title,
        text,
        pictures,
    }
    
    try {
        await Garden.updateOne({ _id: gardenId }, { $push: { posts: newPost }})
        res.status(201)
        res.json({ result: true, message: 'Post created'})
    } catch (error) {
        res.status(400)
        res.json({ result: false, error })
        return
    }

})

// * Get Garden Posts
router.get('/:gardenId/posts', async (req, res) => {
    const { gardenId } = req.params
    const { token } = req.body
    // Error 400 : Missing or empty field(s)
    if(!checkReq([gardenId, token], res)) return

    const garden = await Garden.findById(gardenId)
    // Error 404 : Not found
    if(!isFound('Garden', garden, res)) return

    const user = await User.findOne({ token })
    // Error 404 : Not found
    if(!isFound('User', user, res)) return

    const member = await Garden.findOne({ members: user._id })
    // Error 403 : User is not a member
    if(!isMember(member, res)) return

    res.json({ result: true, posts: garden.posts })

})

// * Create Post Reply
router.post('/:gardenId/post/:postId', async (req, res) => {
    const { gardenId, postId } = req.params
    const { token, text } = req.body
    // Error 400 : Missing or empty field(s)
    if(!checkReq([gardenId, postId, token, text], res)) return

    const garden = await Garden.findById(gardenId)
    // Error 404 : Not found
    if(!isFound('Garden', garden, res)) return

    const post = garden.posts.find(e => String(e._id) === postId)
    // Error 404 : Not found
    if(!isFound('Post', post, res)) return

    const user = await User.findOne({ token })
    // Error 404 : Not found
    if(!isFound('User', user, res)) return

    const member = await Garden.findOne({ members: user._id })
    // Error 403 : User is not a member
    if(!isMember(member, res)) return

    const newReply = {
        owner: member._id,
        text,
        date: new Date(),
    }
    try {
        post.replies.push(newReply)
        await garden.save()
        res.json({ result: true, message: `Reply added to post ${ postId }`})
    } catch (error) {
        res.status(400)
        res.json({ result: false, error })
        return
    }
    
})

// * Get Garden Post Replies
router.get('/:gardenId/post/:postId', async (req, res) => {
    const { gardenId, postId } = req.params
    const { token } = req.body
    // Error 400 : Missing or empty field(s)
    if(!checkReq([gardenId, postId, token], res)) return

    const garden = await Garden.findById(gardenId)
    // Error 404 : Not found
    if(!isFound('Garden', garden, res)) return

    const post = garden.posts.find(e => String(e._id) === postId)
    // Error 404 : Not found
    if(!isFound('Post', post, res)) return

    const user = await User.findOne({ token })
    // Error 404 : Not found
    if(!isFound('User', user, res)) return

    const member = await Garden.findOne({ members: user._id })
    // Error 403 : User is not a member
    if(!isMember(member, res)) return

    res.json({ result: true, replies: post.replies })

})

// * Create an Event
router.post('/:gardenId/event/', async (req, res) => {
    const { gardenId } = req.params
    const { token, title, text, pictures, date } = req.body
    // Error 400 : Missing or empty field(s)
    if(!checkReq([gardenId, token, title, text, pictures, date], res)) return

    const isGarden = await Garden.findById(gardenId)
    // Error 404 : Not found
    if(!isFound('Garden', garden, res)) return

    const user = await User.findOne({ token })
    // Error 404 : Not found
    if(!isFound('User', user, res)) return

    const member = await Garden.findOne({ members: user._id })
    // Error 403 : User is not a member
    if(!isMember(member, res)) return

    const newEvent = {
        owner: member._id,
        title,
        text,
        pictures,
        date: new Date(),
    }
    try {
        await Garden.updateOne({ _id: gardenId }, { $push: { events: newEvent }})
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
    const { token } = req.body
    // Error 400 : Missing or empty field(s)
    if(!checkReq([gardenId, token], res)) return

    const garden = await Garden.findById(gardenId)
    // Error 404 : Not found
    if(!isFound('Garden', garden, res)) return

    const user = await User.findOne({ token })
    // Error 404 : Not found
    if(!isFound('User', user, res)) return

    const member = await Garden.findOne({ members: user._id })
    // Error 403 : User is not a member
    if(!isMember(member, res)) return

    res.json({ result: true, events: garden.events })

})

module.exports = router