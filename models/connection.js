const mongoose = require('mongoose')

mongoose.connect(process.env.CONNECTION_STRING, {
    serverSelectionTimeoutMS: 1000,
    user: process.env.DB_LOGIN,
    pass: process.env.DB_PASSWORD
})
    .then(() => console.log('Connecté à Atlas'))
    .catch(error => console.error(error))