const express = require('express')
const uid2 = require('uid2')
const router = express.Router()
const bcrypt = require('bcrypt')
const User = require('../models/users')
const Garden = require('../models/gardens')

const { checkReq, isFound } = require('../helpers/errorHandlers.js')

// * Create User
router.post('/', async (req, res) => {
    const { email, password, firstname, lastname, username} = req.body

    // Error 400 : Missing or empty field(s)
    if(!checkReq([email, password, username], res)) return

    // Error 409 : Email already used
    const emailUsed = await User.findOne({ email : String(email).toLowerCase() })
    if(emailUsed){
        res.status(409)
        res.json({ result: false, error: 'Email already used'})
        return
    }

    // Error 409 : Username already used
    const usernameUsed = await User.findOne({ username: String(username).toLowerCase() })
    if(usernameUsed){
        res.status(409)
        res.json({ result: false, error: 'Username already used'})
        return
    }

    const hash = bcrypt.hashSync(password, 10)
    const newUser = new User({
        email,
        password: hash,
        username,
        firstname,
        lastname,
        token: uid2(32),
    })

    try {
        await newUser.save()
        res.status(201)
        res.json({ result: true, token: newUser.token, message: `User ${username} created` })
    } catch (error) {
        // Error 400 : User can't be saved
        res.status(400)
        res.json({ result: false, error})
        return
    }
})

//* Get User Token
router.get('/token', async (req, res) => {
    const { email, password } = req.headers

    // Error 400 : Missing or empty field(s)
    if(!checkReq([email, password], res)) return

    const user = await User.findOne({ email })

    // Error 404 : Not found
    if(!isFound('User', user, res)) return

    // Error 403 : Mismatching email / password pair
    if(!bcrypt.compareSync(password, user.password)){
        res.status(403)
        res.json({ result: false, error: 'Mismatching email / password pair' })
        return
    }

    res.json({ result: true, token: user.token })

})

// * Delete User
router.delete('/', async (req, res) => {
    const { token } = req.body

    // Error 400 : Missing or empty field(s)
    if(!checkReq([token], res)) return

    const user = await User.findOne({ token })
    // Error 404 : Not found
    if(!isFound('User', user, res)) return

    const { gardens } = user
    if(gardens.length > 0){
        await user.populate('gardens')
        gardens.forEach(async (garden) => {
            const { posts, events, members, owners } = garden
            if(posts.length > 0){
                posts.forEach(post => {
                    const { replies, likes } = post
                    // remove all user replies
                    replies = replies.filter(reply => String(reply.owner) !== String(user._id))
                    // remove all user likes
                    likes = likes.filter(like => String(like.owner) !== String(user._id))
                })
                // remove all user posts
                posts = posts.filter(post => String(post.owner) !== String(user._id))
            }
            if(events.length > 0){
                events.forEach(event => {
                    const { subscribers } = event
                    // remove all user subscriptions
                    subscribers = subscribers.filter(subscriber => String(subscriber) !== String(user._id)) 
                })
                // remove all user events
                events = events.filter(event => String(event.owner) !== String(user._id))
            }
            if(members.length > 0) {
                // remove from garden members
                members = members.filter(member => String(member) !== String(user._id))
            }
                // TODO owner / last owner ?
            try {
                await Garden.save()
            } catch (error) {
                // Error 400 : Garden can't be updated
                res.status(400)
                res.json({ result: false, error })
                return
            }
        })
    }

    try {
        await User.deleteOne({ token })
        res.json({ result: true, message: 'User and related datas deleted' })
        return   
    } catch (error) {
        // Error 400 : User can't be deleted
        res.status(400)
        res.json({ result: false, error})
        return
    }

})

// * Get User Gardens
router.get('/gardens', async (req, res) => {
    const { token } = req.query

    // Error 400 : Missing or empty field(s)
    if(!checkReq([token], res)) return

    const user = await User.findOne({ token })
    // Error 404 : Not found
    if(!isFound('User', user, res)) return

    res.json({ result: true, gardens: user.gardens })

})

// * Update User Gardens
router.put('/garden/:id', async (req, res) => {
    const { id } = req.params
    const { token } = req.body
    
    // Error 400 : Missing or empty field(s)
    if(!checkReq([id, token], res)) return

    try {
        await Garden.findById(id)
    } catch (error) {
        // Error 400 : Garden can't be read
        res.status(400)
        res.json({ result: false, error})
        return
    }

    const user = await User.findOne({ token })
    // Error 404 : Not found
    if(!isFound('User', user, res)) return

    if(user.gardens.some(e => String(e) === id)){
        await User.updateOne({ token }, { $pullAll: { gardens: [id] } })
        res.json({ result: true, message: `Garden ${ id } removed`})
        return
    } else {
        await User.updateOne({ token }, { $push: { gardens: id } })
        res.json({ result: true, message: `Garden ${ id } added`})
        return
    }
})

module.exports = router