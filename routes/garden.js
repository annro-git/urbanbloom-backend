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
        res.json({ result: true, message: `Garden ${name} created and added to ${user.username} gardens` })
        
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

    garden.posts.push(newPost)
    
    try {
        await Garden.save()
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
    const { token } = req.headers
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
        owner: user._id,
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
    const { token } = req.headers
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

    await garden.populate(`posts.replies.owner`)

    const replies = post.replies.map(reply => {
        return ({
            owner: reply.owner.username,
            createdAt: reply.createdAt,
            text: reply.text,
        })
    })

    res.json({ result: true, replies })

})

// * Update Garden Post Like
router.put('/:gardenId/post/:postId/like', async (req, res) => {
    const { gardenId, postId } = req.params
    const { token, likeType } = req.body
    // Error 400 : Missing or empty field(s)
    if(!checkReq([gardenId, postId, token, likeType], res)) return

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

    const like = post.likes.find(like => String(like.owner) === String(user._id))
    const save = async (verb) => {
        try {
            await garden.save()
            return { result: true, message: `Like ${verb}`}
        } catch (error) {
            return { result: false, error }
        }
    }
    if(!like){
        const newLike = {
            owner: user._id,
            likeType
        }
        post.likes.push(newLike)
        res.json(await save('added'))
        return
    }
    if(like.likeType === likeType){
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

    garden = garden.events.push(newEvent)

    try {
        await garden.save()
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

// * Update Garden Owner
router.put('/:gardenId/owner', async (req, res) => {
    const { gardenId } = req.params
    const { token, username } = req.body
    // Error 400 : Missing or empty field(s)
    if(!checkReq([gardenId, token], res)) return

    const garden = await Garden.findById(gardenId)
    // Error 404 : Not found
    if(!isFound('Garden', garden, res)) return

    const user = await User.findOne({ token })
    // Error 404 : Not found
    if(!isFound('User', user, res)) return
    // Error 403 : User is not an owner
    if(!garden.owners.find(owner => String(owner) === String(user._id))){
        res.status(403)
        res.json({ result: false, error: 'User is not an owner' })
        return
    }

    const target = await User.findOne({ username })
    // Error 404 : Not found
    if(!isFound('Target', target, res)) return
    // Error 403 : Target is not an member
    if(!garden.members.find(member => String(member) === String(target._id))){
        res.status(403)
        res.json({ result: false, error: 'User is not an member' })
        return
    }

    const save = async(message) => {
        try {
            await garden.save()
            return { result: true, message }
        } catch (error) {
            return { result: false, error }
        }
    }

    if(String(user._id) !== String(target._id)){
//  // user !== target
        if(!garden.owners.find(owner => String(owner) === String(target._id))){
//  // user !== target | target !== owner
            garden.owners.push(target)
            res.json(await save(`${ username } added to ${ garden.name } owners`))
            return
        }
//  // user !== target | target === owner
        garden.owners = garden.owners.filter(owner => String(owner) !== String(target._id))
        res.json(await save(`${ username } removed from ${ garden.name } owners`))
        return
    }
// user === target
    if(garden.owners.length > 1){
//  // user === target | user isn't last owner
        garden.owners = garden.owners.filter(owner => String(owner) !== String(user._id))
        res.json(await save(`${ username } revoked is owner status`))
        return
    }
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
                target.gardens = target.gardens.filter(garden => String(garden) !== String(garden._id))
            } else {
                target.gardens.push(garden)
            }
            await target.save()
            return { result: true, message }
        } catch (error) {
            return { result: false, error }
        }
    }

    if(!garden.owners.find(owner => String(owner) === String(user._id))){
// // user !== owner
        if(String(target._id) !== String(user._id)){
// // user !== owner | user !== target
            if(!garden.members.find(e => String(e) === String(target._id))){
// // user !== owner | user !== target | target !== member
                garden.members.push(target)
                res.json(await save(`${target.username} joined ${garden.name} (A)`, true))
                return
            }
// // user !== owner | user !== target | target === member
            garden.members = garden.members.filter(e => String(e) !== String(target._id))
            res.json(await save(`${target.username} left ${garden.name} (A)`, false))
            return
        }
// // user !== owner | user === target
        if(!garden.members.find(e => String(e) === String(target._id))){
// // user !== owner | user === target | user !== member
            garden.members.push(user)
            res.json(await save(`${user.username} joined ${garden.name} (B)`, true))
            return
        }
// // user !== owner | user === target | user === member
        garden.members = garden.members.filter(e => String(e) !== String(user._id))
        res.json(await save(`${user.username} left ${garden.name} (B)`, false))
        return
    }
// // user === owner
    if(String(target._id) !== String(user._id)){
// // user === owner | user !== target
        if(!garden.members.find(e => String(e) === String(target._id))){
// // user === owner | user !== target | target !== member
            garden.members.push(target)
            res.json(await save(`${user.username} added ${target.username} to ${garden.name} (C)`, true))
            return
        }
// // user === owner | user !== target | target === member
        garden.members = garden.members.filter(e => String(e) !== String(target._id))
        res.json(await save(`${user.username} removed ${target.username} from ${garden.name} (C)`, false))
        return
    }
// // user === owner | user === target
    res.status(403)
    res.json({ result: false, error: 'Owner can\'t revoke is member status'})
})

// * Delete Garden
router.delete('/:gardenId', async (req, res) => {
    const { gardenId } = req.params
    const { token } = req.body
    // Error 400 : Missing or empty field(s)
    if(!checkReq([gardenId, token], res)) return

    const garden = await Garden.findOne({ _id: gardenId })
    // Error 404 : Not found
    if(!isFound('Garden', garden, res)) return

    const user = await User.findOne({ token })
    // Error 404 : Not found
    if(!isFound('User', user, res)) return
    // Error 403 : User is not an owner
    if(!garden.owners.find(owner => String(owner) === String(user._id))){
        res.status(403)
        res.json({ result: false, error: 'User is not an owner' })
        return
    }

    const { members } = garden
    await garden.populate('members')
    members.map(async(member) => {
        await User.findOneAndUpdate({ _id: member._id }, { $pullAll: { gardens: [garden._id] } })
    })
    try {
        await Garden.deleteOne({ _id: garden._id })
        res.status(200)
        res.json({ result: true, message: 'Garden deleted' })
    } catch (error) {
        res.status(400)
        res.json({ result: false, error })
    }

})

// * Get Garden

module.exports = router