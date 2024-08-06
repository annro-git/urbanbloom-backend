const express = require('express')
const User = require('../models/users')
const Garden = require('../models/gardens')
const router = express.Router()

const checkReq = (keys) => keys.some(e => !e)
const strToArr = (str) => str.replace(/\[|\]|\'|\"/g, '').split(',').map(e => e.trim())

/* Create a Garden */

router.post('/', async (req, res) => {
    const { latitude, longitude, name, description, token, interests, bonus } = req.body

    // Error 400 if email or password are missing
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

module.exports = router