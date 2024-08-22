const express = require('express')
const router = express.Router()
const User = require('../models/users')
const uid2 = require('uid2')
const cloudinary = require('cloudinary').v2

const { checkReq, isFound } = require('../helpers/errorHandlers')

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUDNAME,
  api_key: process.env.CLOUDINARY_APIKEY,
  api_secret: process.env.CLOUDINARY_APISECRET,
})

/* GET home page. */
router.get('/', (req, res) => {
  res.status(403).send('Forbidden')
})

/* Post picture to Cloudinary */
router.post('/picture', async (req, res) => {
  const { token } = req.body
  const { blob } = req.files
    
  // Error 400 : Missing or empty field(s)
  if(!checkReq([token, blob], res)) return
  
  const user = await User.findOne({ token })
  // Error 404 : Not found
  if(!isFound('User', user, res)) return

  cloudinary.uploader
    .upload_stream(
      { resource_type: 'auto' },
      (error, result) => {
        if(error){
          res.status(500)
          res.json({ result: false, error: 'Error uploading to Cloudinary'})
          return
        }
        res.json({ result: true, url: result.secure_url})
      }
    )
    .end(blob.data)
})

module.exports = router
