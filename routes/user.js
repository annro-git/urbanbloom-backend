const express = require('express')
const uid2 = require('uid2')
const router = express.Router()
const bcrypt = require('bcrypt')
const User = require('../models/users')
const Garden = require('../models/gardens')
// const Event = require('../models/gardens.js')

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

//* Get User ppURI
router.get('/pp', async (req, res) => {
    
    const { username, token } = req.headers

    // Error 400 : Missing or empty field(s)
    if(!checkReq([username, token], res)) return

    const user = await User.findOne({ token })

    // Error 404 : Not found
    if(!isFound('User', user, res)) return

    const owner = await User.findOne({ username })

    // Error 404 : Not found
    if(!isFound('User', owner, res)) return

    res.json({ result: true, ppURI: owner.ppURI })

})

//* Get User Gardens
router.get('/gardens', async (req, res) => {
    const { token } = req.headers

    // Error 400 : Missing or empty field(s)
    if(!checkReq([token], res)) return

    const user = await User.findOne({ token })

    // Error 404 : Not found
    if(!isFound('User', user, res)) return

    res.json({ result: true, gardens: user.gardens })
})

//* Get User Garden details
router.get('/gardens/details', async (req, res) => {
    const { token } = req.headers

    // Error 400 : Missing or empty field(s)
    if(!checkReq([token], res)) return

    const user = await User.findOne({ token })

    // Error 404 : Not found
    if(!isFound('User', user, res)) return

    await user.populate('gardens')

    const filteredGardens = user.gardens.map(garden => {
        return ({
            id: garden._id,
            name: garden.name,
            description: garden.description,
            ppURI: garden.ppURI,
            members: garden.members.length,
        })
    })

    res.json({ result: true, gardens: filteredGardens })

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

    res.json({ result: true, token: user.token, username: user.username })

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
        gardens.map(async (garden) => {
            const owner = garden.owners.find(e => String(e) === String(user._id))
            if(owner && garden.owners.length === 1){
                // delete garden if last owner
                try {
                    await Garden.findOneAndDelete({ _id: garden})
                } catch (error) {
                    res.status(400)
                    res.json({ result: false, error })
                }
                return
            }
            garden.posts.map(post => {
                return ({
                    // delete user replies
                    replies: post.replies.filter(reply => String(reply.owner) !== String(user._id)),
                    // delete user likes
                    likes: post.likes.filter(like => String(like.owner) !== String(user._id))
                })
            })
            // delete user posts
            garden.posts = garden.posts.filter(post => String(post.owner) !== String(user._id))

            garden.events.map(event => {
                return({
                    // delete user subscriptions
                    subscribers: event.subscribers.filter(subscriber => String(subscriber) !== String(user._id)) 
                })
            })
            // delete user events
            garden.events = garden.events.filter(event => String(event.owner) !== String(user._id))

            if(garden.members.length > 1) {
                // update garden members
                garden.members = garden.members.filter(member => String(member) !== String(user._id))
            }
            if(owner) {
                // update garden owners
                garden.owners = garden.owners.filter(e => String(e) !== String(user._id))
            }
            try {
                await garden.save()
            } catch (error) {
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
    const { token } = req.headers

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

// * Get User Events
router.get('/events', async (req, res) => {
    const { token } = req.headers
    
    // Error 400 : Missing or empty field(s)
    if(!checkReq([token], res)) return

    const user = await User.findOne({ token })
    // Error 404 : Not found
    if(!isFound('User', user, res)) return

    await user.populate('gardens')

    let events = []
    user.gardens.forEach(garden => {
        garden.events.forEach(gardenEvent => {
            user.events.forEach(userEvent => {
                if(String(userEvent._id) === String(gardenEvent._id)){
                    events.push({
                        id: userEvent._id,
                        title: gardenEvent.title,
                        text: gardenEvent.text,
                        date: gardenEvent.date,
                        gardenId: garden._id,
                        gardenName: garden.name,
                    })
                }
            })
        })
    })

    res.json({ result: true, events})

})

// * Update User PP
router.put('/pp', async (req, res) => {
    const { token, newPpURI } = req.body
    
    // Error 400 : Missing or empty field(s)
    if(!checkReq([token, newPpURI], res)) return

    const user = await User.findOne({ token })
    // Error 404 : Not found
    if(!isFound('User', user, res)) return

    user.ppURI = newPpURI

    try {
        await user.save()
        res.json({ result: true, message: 'New pp saved'})
    } catch (error) {
        res.status(400)
        res.json({ result: false, error })
    }
})

// * Update User data
router.put('/', async (req, res) => {
    const { firstname, lastname, bio, token } = req.body

    // Error 400 : Missing or empty field(s)
    if(!checkReq([token], res)) return

    const user = await User.findOne({ token })
    // Error 404 : Not found
    if(!isFound('User', user, res)) return

    user.firstname = firstname
    user.lastname = lastname
    user.bio = bio

    try {
        await user.save()
        res.json({ result: true, message: 'User updated'})
    } catch (error) {
        res.status(400)
        res.json({ result: false, error })
    }

})

module.exports = router