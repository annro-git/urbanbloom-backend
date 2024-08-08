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

router.get('/', async (req, res) => {
    try {
        const data = await Event.find()
        if (!data || data.length === 0) {
            res.status(404).json({ result: false, error: 'No events found' })
            return
        }
        res.status(200).json({ events: data })
    } catch (err) {
        res.status(500).json({ result: false, error: 'Internal Server Error' })
    }
});


router.get('/all/:subscriber', async (req, res) => {
    try {
        const data = await Event.find({ subscribers: req.params.subscriber })
        if (!data || data.length === 0) {
            res.status(404).json({ result: false, error: 'No events found for this subscriber' })
            return
        }
        res.status(200).json({ events: data })
    } catch (err) {
        res.status(500).json({ result: false, error: 'Internal Server Error' })
    }
});


router.delete('/events/:id', async (req, res) => {
    try {
        const { id } = req.params
        const data = await Event.findById(id)
        
        if (!data) {
            res.status(404).json({ result: false, error: 'Event not found' })
            return
        }

        await data.remove()
        res.status(200).json({ result: true, message: 'Event successfully deleted' })
    } catch (err) {
        res.status(500).json({ result: false, error: 'Internal Server Error' })
    }
});

module.exports = router