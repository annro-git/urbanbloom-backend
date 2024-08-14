mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const User = require('../models/users');
const Event = require('../models/events');
const Garden = require('../models/gardens');

const { checkReq, isFound } = require('../helpers/errorHandlers.js');


// Get all events
router.get('/', async (req, res) => {
    try {
        const events = await Event.find();
        res.json(events);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delete event
router.delete('/:id', async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!isFound(event)) return res.status(404).json({ message: 'Event not found' });

        await Event.findByIdAndDelete(req.params.id);
        res.json({ message: 'Event deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Add user to event
router.patch('/:id/subscribe', async (req, res) => {

    const { token } = req.body;
    if (!checkReq(token)) return res.status(400).json({ message: 'Missing token' });

    try {
        const event = await Event.findById(req.params.id);
        const user  = await User.findById(req._constructedToken.id);

        if (!isFound(event)) return res.status(404).json({ message: 'Event not found' });

        if (!isFound(user)) return res.status(404).json({ message: 'User not found' });