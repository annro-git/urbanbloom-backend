const express = require('express')
const router = express.Router()
const Event = require('../models/events')

router.post('/new', (req, res) => {

    const { title, description, owner, garden } = req.body
    const date = Date.parse(req.body.date)
    const createdAt = Date.now()
    const subscribers = []

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
        .then(events => res.json(events))
        .catch(err => res.status(400).json('Error: ' + err))
});


router.get('/:id', (req, res) => {
    Event.findById(req.params.id)
        .then(event => res.json(event))
        .catch(err => res.status(400).json('Error: ' + err))
});


router.get('/:subscriber', (req, res) => {
    Event.find({ subscribers: req.params.subscriber })
        .then(events => res.json(events))
        .catch(err => res.status(400).json('Error: ' + err))
});


router.get('/:garden', (req, res) => {
    Event.find({ garden: req.params.garden })
        .then(events => res.json(events))
        .catch(err => res.status(400).json('Error: ' + err))
});


module.exports = router