const express = require('express')
const router = express.Router()

/* Create User */
router.post('/', (req, res) => {
    res.send('hello!')
})

module.exports = router