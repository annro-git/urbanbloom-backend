const mongoose = require('mongoose')


const ToolSchema = mongoose.Schema({
    name: String,
    type: {
        type: String,
        default: 'tool',
    },
    image: String,
    text: String,
})

const Tool = mongoose.model('tools', ToolSchema)
module.exports = Tool