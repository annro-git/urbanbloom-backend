const express = require('express')
const User = require('../models/users')
const Garden = require('../models/gardens')
const uid2 = require('uid2');
const bcrypt = require('bcrypt');
const router = express.Router()

const checkReq = (keys) => keys.some(e => !e)

/* Create an User */
router.post('/', async (req, res) => {
    const { email, password, firstname, lastname} = req.body

    // Error 400 if email or password are missing
    if(checkReq([email, password])){
        res.status(400)
        res.json({ result: false, error: 'Missing or empty fields'})
        return
    }

    // Error 409 if email already exists
    const isExists = await User.findOne({ email : String(email).toLowerCase() })
    if(isExists){
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

/* Delete an User by token */
router.delete('/:token', async (req, res) => {
    const { token } = req.params

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

/* Toggle Garden to an User */
router.put('/garden/:id', async (req, res) => {
    const { id } = req.params
    const { token } = req.body
    
    // Error 400 if garden or token are missing
    if(checkReq([id, token])){
        res.status(400)
        res.json({ result: false, error: 'Missing or empty fields'})
    }

    // Error 404 if garden doesn't exist
    const isGardenExists = await Garden.findOne({ _id }) // TODO : make garden routes
    if(!isGardenExists){
        res.status(404)
        res.json({ result: false, error: 'Garden not found' })
        return
    }

    // Error 404 if user doesn't exist
    const currentUser = await User.findOne({ token })
    if(!currentUser){
        res.status(404)
        res.json({ result: false, error: 'User not found' })
        return
    }

    const userGardens = currentUser.userGarden
    res.json({ result: true, message: userGardens })

})

module.exports = router