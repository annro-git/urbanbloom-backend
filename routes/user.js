const express = require('express')
const router = express.Router()
const User = require('../models/users')
const Event = require('../models/events')
const uid2 = require('uid2');
const bcrypt = require('bcrypt');

const checkReq = (keys) => keys.some(e => !e)

/* router.get('/', async (req, res) => {
    console.log('Received GET request on /');
    const data = await User.find()
      
            console.log(data);
            if (data.length >= 0) {
            res.json({ result: true, users: data });
            }
        else {
            console.error('Error fetching users:', error);
            res.status(500).json({ result: false, error: error.message });
        };
}); */

router.get('/', async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json({ result: true, users });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ result: false, error: error.message });
    }
});


router.post('/register', (req, res) => {
    const { firstname, lastname, email, password, username } = req.body
    const token = uid2(32);
    const hash = bcrypt.hashSync(password, 10);
    const user = new User({ firstname, lastname, email, password: hash, username, token });
    user.save()
        .then(() => {
            res.json({ result: true, user: user })
        })
        .catch(error => {
            res.json({ result: false, error: error })
        })
});


router.post('/login', (req, res) => {

    const { username, email, password } = req.body;

    User.findOne({ $or: [{ username }, { email }] })
        .then(data => {
            if (data && bcrypt.compareSync(password, data.password)) {
                res.json({ result: true, user: data })
            } else {
                res.json({ result: false, error: 'User not found' })
            }
        })
        .catch(error => {
            res.json({ result: false, error: error })
        })
});





router.get('/event/:userid', async (req, res) => {
    const { userid } = req.params
    const { token } = req.body

    if (checkReq([userid, token])) {
        res.status(400)
        res.json({ result: false, error: 'Missing or empty fields' })
        return
    }

    try {
        const data = await Event.findById(userid)
        res.json({ result: true, events: data })
    } catch (error) {
        // Error 400 if garden objectid isn't validated
        res.status(400)
        res.json({ result: false, error })
        return
    }
});





module.exports = router
