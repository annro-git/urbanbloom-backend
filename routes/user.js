const express = require('express')
const User = require('../models/users')
const Garden = require('../models/gardens')
const uid2 = require('uid2');
const bcrypt = require('bcrypt');
const router = express.Router()

const checkReq = (keys) => keys.some(e => !e)

// * Create User
router.post('/', async (req, res) => {
    const { email, password, firstname, lastname} = req.body

    // Error 400 if email or password are missing
    if(checkReq([email, password])){
        res.status(400)
        res.json({ result: false, error: 'Missing or empty field(s)'})
        return
    }

    // Error 409 if email already exists
    const isUsed = await User.findOne({ email : String(email).toLowerCase() })
    if(isUsed){
        res.status(409)
        res.json({ result: false, error: 'Email already exists'})
        return
    }

    const hash = bcrypt.hashSync(password, 10)
    const newUser = new User({
        email,
        password: hash,
        firstname,
        lastname,
        token: uid2(32),
    })

    try {
        await newUser.save()
        res.status(201)
        res.json({ result: true, token: newUser.token, message: `User ${newUser.email} created` })
    } catch (error) {
        // Error 400 if model datas aren't validated
        res.status(400)
        res.json({ result: false, error})
        return
    }
})

//* Get User Token
router.get('/', async (req, res) => {
    const { email, password } = req.body

    // Error 400 if field is missing
    if(checkReq([email, password])){
        res.status(400)
        res.json({ result: false, error: 'Missing or empty field(s)' })
        return
    }

    const user = await User.findOne({ email })
    // Error 404 if user doesn't exist
    if(!user){
        res.status(404)
        res.json({ result: false, error: 'User not found' })
        return
    }
    // Error 403 if password isn't matching
    if(!bcrypt.compareSync(password, user.password)){
        res.status(403)
        res.json({ result: false, error: 'Wrong email or password' })
        return
    }

    res.json({ result: true, token: user.token })

})

// * Delete User
// TODO : remove all reference in gardens (posts, replies, events)
router.delete('/', async (req, res) => {
    const { token } = req.body

    // Error 400 if email is missing
    if(checkReq([token])){
        res.status(400)
        res.json({ result: false, error: 'Missing token' })
        return
    }

    const response = await User.findOneAndDelete({ token })
    // Error 404 if token doesn't exist
    if(!response){
        res.status(404)
        res.json({ result: false, error: 'User not found' })
        return
    }

    res.json({ result: true, message: 'User deleted' })

})

// * Get User Gardens
router.get('/gardens', async (req, res) => {
    const { token } = req.body

    // Error 400 if token is missing
    if(checkReq([token])){
        res.status(400)
        res.json({ result: false, error: 'Missing token' })
        return
    }

    const response = await User.findOne({ token })
    // Error 404 if token doesn't exist
    if(!response){
        res.status(404)
        res.json({ result: false, error: 'User not found' })
        return
    }

    res.json({ result: true, gardens: response.gardens })

})

// * Update User Garden
router.put('/garden/:id', async (req, res) => {
    const { id } = req.params
    const { token } = req.body
    
    // Error 400 if garden or token are missing
    if(checkReq([id, token])){
        res.status(400)
        res.json({ result: false, error: 'Missing or empty field(s)'})
        return
    }

    try {
        await Garden.findById(id)
    } catch (error) {
        // Error 400 if garden objectid isn't validated
        res.status(400)
        res.json({ result: false, error})
        return
    }

    // Error 404 if user doesn't exist
    const currentUser = await User.findOne({ token })
    if(!currentUser){
        res.status(404)
        res.json({ result: false, error: 'User not found' })
        return
    }

    if(currentUser.gardens.some(e => String(e) === id)){
        await User.updateOne({ token }, { $pullAll: { gardens: [id] } })
        res.json({ result: true, message: `Garden ${ id } removed`})
        return
    } else {
        await User.updateOne({ token }, { $push: { gardens: id } })
        res.json({ result: true, message: `Garden ${ id } added`})
        return
    }
})

// * Get User Posts
router.get('/posts/', async (req, res) => {
    const { token } = req.body

    // Error 400 if token is missing
    if(checkReq([token])){
        res.status(400)
        res.json({ result: false, error: 'Missing or empty field(s)'})
        return
    }

    // Error 404 if user doesn't exist
    const user = await User.findOne({ token })
    if(!user){
        res.status(404)
        res.json({ result: false, error: 'User not found' })
        return
    }

    const { gardens } = user
    await user.populate('gardens')
    const posts = gardens.map(garden => {
        return ({
            name: garden.name,
            id: garden._id,
            posts: garden.posts.filter(post => String(post.owner) === String(user._id))
        })
    })
    res.json({ result: true, data: posts})

})

module.exports = router