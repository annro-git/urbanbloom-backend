const express = require('express')
const User = require('../models/users')
const Garden = require('../models/gardens')
const uid2 = require('uid2');
const bcrypt = require('bcrypt');
const { isObjectIdOrHexString } = require('mongoose');
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

/* Get garden list from an User */
router.get('/garden/:token', async (req, res) => {
    const { token } = req.params

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

/* Toggle Garden to an User */
router.put('/garden/:id', async (req, res) => {
    const { id } = req.params
    const { token } = req.body
    
    // Error 400 if garden or token are missing
    if(checkReq([id, token])){
        res.status(400)
        res.json({ result: false, error: 'Missing or empty fields'})
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
        await User.findOneAndUpdate({ token }, { gardens: [...currentUser.gardens.filter(e => String(e) !== id)] })
        res.json({ result: true, message: `Garden ${ id } removed`})
        return
    } else {
        await User.findOneAndUpdate({ token }, { gardens: [...currentUser.gardens, id] })
        res.json({ result: true, message: `Garden ${ id } added`})
        return
    }

})

module.exports = router