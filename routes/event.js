mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const User = require('../models/users');
const Event = require('../models/events');
const Garden = require('../models/gardens');

const { checkReq, isFound } = require('../helpers/errorHandlers.js');


// Get all events
router.get('/', async (req, res) => {
    const { token } = req.body;

    if (!checkReq(res, token)) return;

    try {
        const events = await Event.find();
        res.json(events);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});