require('dotenv').config()
require('./models/connection')

require('./models/connection')
const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const logger = require('morgan')

const indexRouter = require('./routes/index')
const usersRouter = require('./routes/user')
const gardensRouter = require('./routes/garden')
const cors = require('cors')
const app = express()

app.use(cors())
app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

app.use('/', indexRouter)
app.use('/user/', usersRouter)
app.use('/garden', gardensRouter)

module.exports = app
