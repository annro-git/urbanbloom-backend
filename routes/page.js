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
    console.log(text)

    const currentPage = {
        name,
        type,
        sow: {
            from: new Date(sow.start).getMonth(),
            to: new Date(sow.end).getMonth(),
        },
        harvest: {
            from: new Date(harvest.start).getMonth(),
            to: new Date(harvest.end).getMonth()
        },
        image,
        text,
    }

    res.json({ result: true, currentPage })

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

    const pages = await Page.find({})

    const filteredPages = pages.map(page => {
        let result = { period: [] }
        const currentMonth = Number(month)
        const nextYearCurrentMonth = currentMonth+12
        const sowStart = new Date(page.sow.start).getMonth()
        const sowEnd = new Date(page.sow.end).getMonth()
        const harvestStart = new Date(page.harvest.start).getMonth()
        const harvestEnd = new Date(page.harvest.end).getMonth()

        if((sowEnd >= sowStart) && (currentMonth >= sowStart && currentMonth <= sowEnd)){
            result.period.push('sow')
        }

        if((sowEnd < sowStart) && (nextYearCurrentMonth >= sowStart && nextYearCurrentMonth <= sowEnd)){
            result.period.push('sow')
        }

        if((harvestEnd >= harvestStart) && (currentMonth >= harvestStart && currentMonth <= harvestEnd)){
            result.period.push('harvest')
        }

        if((harvestEnd < harvestStart) && (nextYearCurrentMonth >= harvestStart && nextYearCurrentMonth <= harvestEnd)){
            result.period.push('harvest')
        }

        if(result.period.length === 0){
            return
        }

        return { name: page.name, type: page.type, period: result.period }
        
    }).filter(e => !!e)
    res.json({ filteredPages })

})

module.exports = router