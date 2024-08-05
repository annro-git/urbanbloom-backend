const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: String,
    firstname: String,
    lastname: String,
    email: String,
    password: String,
    token: String,
    ppURI: String,      //Comment l'avoir à l'inscription
    gardens: [Number],  //Comment l'avoir à l'inscription
    posts: [Number],    //Comment l'avoir à l'inscription   
    events: [Number],   //Comment l'avoir à l'inscription
    privacyMode: Boolean,
});

const User = mongoose.model('User', userSchema);
module.exports = User;