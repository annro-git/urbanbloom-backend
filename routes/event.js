const express = require('express')
const router = express.Router()
const Event = require('../models/events')

router.post('/new', (req, res) => {

    const { title, description, owner, garden } = req.body
    const date = Date.parse(req.body.date)

    if (checkReq([title, description, owner, garden, date])) {
        res.status(400)
        res.json({ result: false, error: 'Missing or empty fields' })
        return
    }

    const newEvent = new Event({
        title,
        description,
        owner,
        garden,
        subscribers,
        date,
        createdAt
    })

    newEvent.save()
        .then(() => res.json('Event added!'))
        .catch(err => res.status(400).json('Error: ' + err))
});

router.get('/', (req, res) => {

    Event.find()
        .then(data => res.json({ events: data }))
        .catch(err => res.status(400).json('Error: ' + err))

});


router.get('/:subscriber', (req, res) => {

    Event.find({ subscribers: req.params.subscriber })
        .then(data => res.json({ events: data }))
        .catch(err => res.status(400).json('Error: ' + err))

});

router.get('/:garden', (req, res) => {
    Event.find({ garden: req.params.garden })
        .then(data => res.json({ events: data }))
        .catch(err => res.status(400).json('Error: ' + err))
});

module.exports = router