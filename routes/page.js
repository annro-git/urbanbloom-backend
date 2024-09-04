const express = require('express')
const router = express.Router()
const User = require('../models/users')
const Page = require('../models/pages')

const { checkReq, isFound } = require('../helpers/errorHandlers')

// Read Page
router.get('/', async (req, res) => {
    const { token } = req.headers
    const { name } = req.query

    // Error 400 : Missing or empty field(s)
    if(!checkReq([token, name], res)) return

    const user = await User.findOne({ token })
    // Error 404 : Not found
    if(!isFound('User', user, res)) return

    const page = await Page.findOne({ name }).lean()
    if(!isFound('Page', page, res)) return

    const { type, sow, harvest, image, text } = page

    const currentPage = {
        name,
        type,
        sow: {
            from: sow.start,
            to: sow.end,
        },
        harvest: {
            from: harvest.start,
            to: harvest.end
        },
        image,
        text,
    }

    res.json({ result: true, page: currentPage })

})

// Get Pages
router.get('/all/', async (req, res) => {
    const { token } = req.headers

    // Error 400 : Missing or empty field(s)
    if(!checkReq([token], res)) return

    const user = await User.findOne({ token })
    // Error 404 : Not found
    if(!isFound('User', user, res)) return

    const pages = await Page.find({})

    const filteredPages = pages.map(page => {
        const { name, type, image } = page
        return ({ name, type, image })
    })
    res.json({ result: true, pages: filteredPages })
})

// Get Pages by current month
router.get('/current/', async (req, res) => {
    const { token } = req.headers

    const { month } = req.query
    // expecting number [0,11]
    if(Number(month) < 0 || Number(month) > 11){
        res.status(400)
        res.json({ result: false, error: 'Month does not exist'})
        return
    }

    // Error 400 : Missing or empty field(s)
    if(!checkReq([token, month], res)) return

    const user = await User.findOne({ token })
    // Error 404 : Not found
    if(!isFound('User', user, res)) return

    let pages = await Page.find({})

    pages = pages.map(page => {
        const mm = Number(month) + 1
        if (mm > page.sow.start && mm <= page.sow.end) {
            return ({
                timeTo: 'sow',
                name: page.name,
                image: page.image,
                type: page.type
            })
        } else if (mm > page.harvest.start && mm <= page.harvest.end) {
            return ({
                timeTo: 'harvest',
                name: page.name,
                image: page.image,
                type: page.type,
            })
        }
    }).filter(page => page)

    let sortedPages = {
        sow: {
            fruit: pages.filter(page => page.timeTo === 'sow' && page.type === 'fruit'),
            vegetable: pages.filter(page => page.timeTo === 'sow' && page.type === 'vegetable'),
            flower: pages.filter(page => page.timeTo === 'sow' && page.type === 'flower'),
        },
        harvest: {
            fruit: pages.filter(page => page.timeTo === 'harvest' && page.type === 'fruit'),
            vegetable: pages.filter(page => page.timeTo === 'harvest' && page.type === 'vegetable'),
            flower: pages.filter(page => page.timeTo === 'harvest' && page.type === 'flower'),
        }
    }

    res.json({ result: true, pages: sortedPages })

})

module.exports = router