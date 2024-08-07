require('dotenv').config()
require('./models/connection')

require('./models/connection')
const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const logger = require('morgan')

const indexRouter = require('./routes/index')
const userRouter = require('./routes/user')
const postRouter = require('./routes/post')
const gardenRouter = require('./routes/garden')
const cors = require('cors')
const app = express()

app.use(cors())
app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

app.use('/', indexRouter)
app.use('/user', userRouter)
app.use('/post', postRouter)
app.use('/garden', gardenRouter)

module.exports = app
