const express = require('express')
const User = require('../models/users')
const uid2 = require('uid2');
const bcrypt = require('bcrypt');
const router = express.Router()

const checkReq = (keys) => !keys.some(e => !e)

/* Create User */
router.post('/', async (req, res) => {
    const { email, password, firstname, lastname} = req.body

    // Error 400 if email or password aren't filled
    if(!checkReq([email, password])){
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

    const newUser = new User({
        email,
        password,
        firstname,
        lastname,
        token: uid2(32),
    })

    try {
        await newUser.save()
        res.status(201)
        res.json({ result: true, token: newUser.token, message: `User ${newUser.email} created` })
    } catch (error) {
        // Error 400 if model datas aren't validate
        res.status(400)
        res.json({ result: false, error})
        return
    }
})

module.exports = router