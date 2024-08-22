const express = require('express')
const router = express.Router()
const User = require('../models/users')
const Bytescale = require('@bytescale/sdk')
const nodefetch = require('node-fetch')
const uid2 = require('uid2')

const uploadManager = new Bytescale.UploadManager({
  apiKey: process.env.BYTESCALE_TOKEN,
  fetchApi: nodefetch,
})

const fileApi = new Bytescale.FileApi({
  apiKey: process.env.BYTESCALE_TOKEN
})

const { checkReq, isFound } = require('../helpers/errorHandlers')

/* GET home page. */
router.get('/', (req, res) => {
  res.status(403).send('Forbidden')
})

router.post('/picture', async (req, res) => {
  const { token } = req.body
  const { blob } = req.files
    
  // Error 400 : Missing or empty field(s)
  if(!checkReq([token], res)) return
  
  const user = await User.findOne({ token })
  // Error 404 : Not found
  if(!isFound('User', user, res)) return

  console.log(blob)
  const response = await uploadManager.upload({
    data: blob.data,
    type: blob.mime,
    originalFileName: blob.name,
    tags: ['from/'+user.username],
    path: {
      fileName: uid2(16)+'{ORIGINAL_FILE_EXT}'
    }
    
  })
  console.log(response)

  res.json({ result: true })
})

module.exports = router
