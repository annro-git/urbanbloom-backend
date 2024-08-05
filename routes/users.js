const express = require('express')
const router = express.Router()
const User = require('../models/user')
const uid2 = require('uid2');



router.get('/', (req, res) => {
    User.find()
        .then(data => {
            res.json({ result: true, users: data })
        })
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










module.exports = router
