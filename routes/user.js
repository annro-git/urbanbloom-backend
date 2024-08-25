mongoose = require('mongoose')
const express = require('express')
const uid2 = require('uid2')
const router = express.Router()
const bcrypt = require('bcrypt')
const User = require('../models/users')
const Garden = require('../models/gardens')
// const Event = require('../models/gardens.js')

const { checkReq, isFound } = require('../helpers/errorHandlers.js')
// const { mongo } = require('mongoose')

// * Create User
router.post('/', async (req, res) => {
    const { email, password, firstname, lastname, username } = req.body

    // Error 400 : Missing or empty field(s)
    if (!checkReq([email, password, username], res)) return

    // Error 409 : Email already used
    const emailUsed = await User.findOne({ email: String(email).toLowerCase() })
    if (emailUsed) {
        res.status(409)
        res.json({ result: false, error: 'Email already used' })
        return
    }

    // Error 409 : Username already used
    const usernameUsed = await User.findOne({ username: String(username).toLowerCase() })
    if (usernameUsed) {
        res.status(409)
        res.json({ result: false, error: 'Username already used' })
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
        res.json({ result: false, error })
        return
    }
})

//* Get User Gardens
router.get('/gardens', async (req, res) => {
    const { token } = req.headers

    // Error 400 : Missing or empty field(s)
    if(!checkReq([token], res)) return

    const user = await User.findOne({ token }).populate('gardens')

    // Error 404 : Not found
    if(!isFound('User', user, res)) return

    res.json({ result: true, gardens: user.gardens })
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

/*// * Delete User
router.delete('/', async (req, res) => {
    const { token } = req.body

    // Error 400 : Missing or empty field(s)
    if (!checkReq([token], res)) return

    const user = await User.findOne({ token })
    // Error 404 : Not found
    if (!isFound('User', user, res)) return

    const { gardens } = user
    if (gardens.length > 0) {
        await user.populate('gardens')
        gardens.map(async (garden) => {
            const owner = garden.owners.find(e => String(e) === String(user._id))
            if (owner && garden.owners.length === 1) {
                // delete garden if last owner
                try {
                    await Garden.findOneAndDelete({ _id: garden })
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
                return ({
                    // delete user subscriptions
                    subscribers: event.subscribers.filter(subscriber => String(subscriber) !== String(user._id))
                })
            })
            // delete user events
            garden.events = garden.events.filter(event => String(event.owner) !== String(user._id))

            if (garden.members.length > 1) {
                // update garden members
                garden.members = garden.members.filter(member => String(member) !== String(user._id))
            }
            if (owner) {
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
        res.json({ result: false, error })
        return
    }

}); */

// Delete User
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

// * Create event
router.post('/event', async (req, res) => {
    const { title, description, date, hour, location, gardenId, pictures } = req.body;
    const { token } = req.headers;

    // Error 400 : Missing or empty field(s)
    if (!checkReq([token, title, description, date, hour, location, gardenId, pictures], res)) return;

    // Validate date format (JJ/MM/AAAA)
    const dateRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
    if (!dateRegex.test(date)) {
        return res.status(400).json({ result: false, error: 'Invalid date format! Expected format is JJ/MM/AAAA.' });
    }

    // Validate hour format (hh:mm)
    const hourRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!hourRegex.test(hour)) {
        return res.status(400).json({ result: false, error: 'Invalid hour format! Expected format is hh:mm.' });
    }

    // Convert date to ISO format (YYYY-MM-DD)
    const [day, month, year] = date.split('/');
    const isoDate = `${year}-${month}-${day}T${hour}:00.000Z`;

    try {
        const user = await User.findOne({ token });
        // Error 404 : Not found
        if (!isFound('User', user, res)) return;

        const gardenExists = await Garden.findById(gardenId);
        // Error 404 : Not found
        if (!isFound('Garden', gardenExists, res)) return;

        const newEvent = new Event({
            title,
            description,
            date: isoDate,
            pictures,
            hour,
            location,
            garden: gardenExists._id,
            creator: user._id,
        });

        await newEvent.save();

        await User.updateOne({ _id: user._id }, { $push: { createdEvents: newEvent._id, subscribedEvents: newEvent._id } });
        await Garden.updateOne({ _id: gardenExists._id }, { $push: { events: newEvent._id } });

        res.status(201).json({ result: true, message: 'Event created' });
    } catch (error) {
        res.status(500).json({ result: false, error: error.message });
    }
});

// Join garden
router.put('/garden/:gardenId/join', async (req, res) => {
    const { gardenId } = req.params;
    const { token } = req.headers;

    // Error 400 : Missing or empty field(s)
    if (!checkReq([gardenId, token], res)) return;

    try {
        const user = await User.findOne({ token });
        // Error 404 : Not found
        if (!isFound('User', user, res)) return;

        const garden = await Garden.findById(gardenId);
        // Error 404 : Not found
        if (!isFound('Garden', garden, res)) return;

        // Error 400 : User already in garden
        if (garden.members.includes(user._id)) {
            return res.status(400).json({ result: false, error: 'User already in garden' });
        }

        await Garden.updateOne({ _id: garden._id }, { $push: { members: user._id } });
        await User.updateOne({ _id: user._id }, { $push: { gardens: garden._id } });

        res.status(200).json({ result: true, message: 'User joined garden' });
    } catch (error) {
        res.status(500).json({ result: false, error: error.message });
    }
});

// * Get User Gardens
router.get('/gardens', async (req, res) => {
    const { token } = req.headers

    // Error 400 : Missing or empty field(s)
    if(!checkReq([token], res)) return

    const user = await User.findOne({ token })
    // Error 404 : Not found
    if(!isFound('User', user, res)) return

    await user.populate('gardens')

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

        console.log(events)
    res.json({ result: true, events})

})

module.exports = router
