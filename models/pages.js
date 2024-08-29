const mongoose = require('mongoose')

const PageSchema = mongoose.Schema({
    name: String,
    type: {
        type: String,
        enum: ['fruit', 'vegetable', 'flower']
    },
    sow: {
        start: Date,
        end: Date,
    },
    harvest: {
        start: Date,
        end: Date,
    },
    image: String,
    text: String,
})

const Page = mongoose.model('pages', PageSchema)
module.exports = Page