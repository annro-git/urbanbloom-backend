const express = require('express')
const User = require('../models/users')
const Garden = require('../models/gardens')
const router = express.Router()

const checkReq = (keys) => keys.some(e => !e)
const strToArr = (str) => str.replace(/\[|\]|\'|\"/g, '').split(',').map(e => e.trim())

// * Create a Garden
router.post('/', async (req, res) => {
    const { latitude, longitude, name, description, token, interests, bonus } = req.body

    // Error 400 if value is missing
    if(checkReq([latitude, longitude, name, description, token, interests, bonus])){
        res.status(400)
        res.json({ result: false, error: 'Missing or empty fields'})
        return
    }

    // get owner
    const owner = await User.findOne({ token })
    if(!owner){
        res.status(404)
        res.json({ result: false, error: 'User not found' })
        return
    }
    const owners = [owner]
    const members = [owner]
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
        await User.updateOne({ token }, { $push: { gardens: response._id} }) // add garden to owner garden list
        res.status(201)
        res.json({ result: true, message: `Garden ${name} created and added to ${owner._id} gardens` })
        
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

    // Error 400 if value is missing
    if(checkReq([gardenId, token, title, text, pictures])){
        res.status(400)
        res.json({ result: false, error: 'Missing or empty fields'})
        return
    }

    // Error 404 if garden doesn't exist
    const isGarden = await Garden.findById(gardenId)
    if(!isGarden){
        res.status(404)
        res.json({ result: false, error: 'Garden not found' })
        return
    }

    // Error 404 if user doesn't exist
    const postOwner = await User.findOne({ token })
    if(!postOwner){
        res.status(404)
        res.json({ result: false, error: 'User not found' })
        return
    }

    // Error 403 if user is not a garden member
    const isMember = await Garden.findOne({ members: postOwner._id })
    if(!isMember){
        res.status(403)
        res.json({ result: false, error: 'User is not a member'})
        return
    }

    const newPost = {
        owner: postOwner._id,
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

    // Error 400 if value is missing
    if(checkReq([gardenId, token])){
        res.status(400)
        res.json({ result: false, error: 'Missing or empty fields'})
        return
    }

    // Error 404 if garden doesn't exist
    const isGarden = await Garden.findById(gardenId)
    if(!isGarden){
        res.status(404)
        res.json({ result: false, error: 'Garden not found' })
        return
    }

    // Error 404 if user doesn't exist
    const replyOwner = await User.findOne({ token })
    if(!replyOwner){
        res.status(404)
        res.json({ result: false, error: 'User not found' })
        return
    }

    // Error 403 if user is not a garden member
    const isMember = await Garden.findOne({ members: replyOwner._id })
    if(!isMember){
        res.status(403)
        res.json({ result: false, error: 'User is not a member'})
        return
    }

    res.json({ result: true, posts: isGarden.posts })

})

// * Create Post Reply
router.post('/:gardenId/post/:postId', async (req, res) => {
    const { gardenId, postId } = req.params
    const { token, text } = req.body

    // Error 400 if value is missing
    if(checkReq([gardenId, postId, token, text])){
        res.status(400)
        res.json({ result: false, error: 'Missing or empty fields'})
        return
    }

    // Error 404 if garden doesn't exist
    const isGarden = await Garden.findById(gardenId)
    if(!isGarden){
        res.status(404)
        res.json({ result: false, error: 'Garden not found' })
        return
    }

    // Error 404 if post doesn't exist
    const isPost = isGarden.posts.find(e => String(e._id) === postId)
    if(!isPost){
        res.status(404)
        res.json({ result: false, error: 'Post not found' })
    }

    // Error 404 if user doesn't exist
    const replyOwner = await User.findOne({ token })
    if(!replyOwner){
        res.status(404)
        res.json({ result: false, error: 'User not found' })
        return
    }

    // Error 403 if user is not a garden member
    const isMember = await Garden.findOne({ members: replyOwner._id })
    if(!isMember){
        res.status(403)
        res.json({ result: false, error: 'User is not a member'})
        return
    }

    const newReply = {
        owner: isMember._id,
        text,
        date: new Date(),
    }
    try {
        isPost.replies.push(newReply)
        await isGarden.save()
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

    // Error 400 if value is missing
    if(checkReq([gardenId, postId, token])){
        res.status(400)
        res.json({ result: false, error: 'Missing or empty fields'})
        return
    }

    // Error 404 if garden doesn't exist
    const isGarden = await Garden.findById(gardenId)
    if(!isGarden){
        res.status(404)
        res.json({ result: false, error: 'Garden not found' })
        return
    }

    // Error 404 if post doesn't exist
    const isPost = isGarden.posts.find(e => String(e._id) === postId)
    if(!isPost){
        res.status(404)
        res.json({ result: false, error: 'Post not found' })
    }

    // Error 404 if user doesn't exist
    const replyOwner = await User.findOne({ token })
    if(!replyOwner){
        res.status(404)
        res.json({ result: false, error: 'User not found' })
        return
    }

    // Error 403 if user is not a garden member
    const isMember = await Garden.findOne({ members: replyOwner._id })
    if(!isMember){
        res.status(403)
        res.json({ result: false, error: 'User is not a member'})
        return
    }

    res.json({ result: true, replies: isPost.replies })

})

// * Create an Event
router.post('/:gardenId/event/', async (req, res) => {
    const { gardenId } = req.params
    const { token, title, text, pictures, date } = req.body

    // Error 400 if value is missing
    if(checkReq([gardenId, token, title, text, pictures, date])){
        res.status(400)
        res.json({ result: false, error: 'Missing or empty fields'})
        return
    }

    // Error 404 if garden doesn't exist
    const isGarden = await Garden.findById(gardenId)
    if(!isGarden){
        res.status(404)
        res.json({ result: false, error: 'Garden not found' })
        return
    }

    // Error 404 if user doesn't exist
    const postOwner = await User.findOne({ token })
    if(!postOwner){
        res.status(404)
        res.json({ result: false, error: 'User not found' })
        return
    }

    // Error 403 if user is not a garden member
    const isMember = await Garden.findOne({ members: postOwner._id })
    if(!isMember){
        res.status(403)
        res.json({ result: false, error: 'User is not a member'})
        return
    }

    const newEvent = {
        owner: isMember._id,
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

    // Error 400 if value is missing
    if(checkReq([gardenId, token])){
        res.status(400)
        res.json({ result: false, error: 'Missing or empty fields'})
        return
    }

    // Error 404 if garden doesn't exist
    const isGarden = await Garden.findById(gardenId)
    if(!isGarden){
        res.status(404)
        res.json({ result: false, error: 'Garden not found' })
        return
    }

    // Error 404 if user doesn't exist
    const replyOwner = await User.findOne({ token })
    if(!replyOwner){
        res.status(404)
        res.json({ result: false, error: 'User not found' })
        return
    }

    // Error 403 if user is not a garden member
    const isMember = await Garden.findOne({ members: replyOwner._id })
    if(!isMember){
        res.status(403)
        res.json({ result: false, error: 'User is not a member'})
        return
    }

    res.json({ result: true, events: isGarden.events })

})

module.exports = router