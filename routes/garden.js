const express = require('express')
const User = require('../models/users')
const Garden = require('../models/gardens')
const router = express.Router()

const checkReq = (keys) => keys.some(e => !e)
const strToArr = (str) => str.replace(/\[|\]|\'|\"/g, '').split(',').map(e => e.trim())

/* Create a Garden */

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

/* Create a Post */
router.post('/:id/post/', async (req, res) => {
    const { id } = req.params
    const { token, title, text, pictures } = req.body

    // Error 400 if value is missing
    if(checkReq([id, token, title, text, pictures])){
        res.status(400)
        res.json({ result: false, error: 'Missing or empty fields'})
        return
    }

    // Error 404 if garden doesn't exist
    const isGarden = await Garden.findById(id)
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
        owner: isMember._id,
        title,
        text,
        pictures,
    }
    try {
        await Garden.updateOne({ _id: id }, { $push: { posts: newPost }})
        res.status(201)
        res.json({ result: true, message: 'Post created'})
    } catch (error) {
        res.status(400)
        res.json({ result: false, error })
        return
    }

})

/* Create an Event */
router.post('/:id/event/', async (req, res) => {
    const { id } = req.params
    const { token, title, text, pictures, date } = req.body

    // Error 400 if value is missing
    if(checkReq([id, token, title, text, pictures, date])){
        res.status(400)
        res.json({ result: false, error: 'Missing or empty fields'})
        return
    }

    // Error 404 if garden doesn't exist
    const isGarden = await Garden.findById(id)
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
        await Garden.updateOne({ _id: id }, { $push: { events: newEvent }})
        res.status(201)
        res.json({ result: true, message: 'Event created'})
    } catch (error) {
        res.status(400)
        res.json({ result: false, error })
        return
    }

})

module.exports = router