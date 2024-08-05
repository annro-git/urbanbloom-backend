const mongoose = require('mongoose')

const UserSchema = mongoose.Schema({
    email: String,
    token: String,
    password: String,
    firstname: String,
    lastname: String,
    ppURI: String,
    gardens: Array, // ! of garden objectId
    posts: Array, // ! of post objectId
    events: Array, // ! of event objectId
    privacy: Boolean,
    idAdmin: Boolean,
})

const User = mongoose.model('users', UserSchema)
module.exports = User