const express = require('express')
const router  = express.Router()
const auth    = require('../middleware/authMiddleware')
const { uploadProfile } = require('../config/cloudinary')
const { getProfile, updateProfile } = require('../controllers/userController')

router.get('/profile',  auth, getProfile)
router.put('/profile',  auth, uploadProfile.single('profileImage'), updateProfile)

module.exports = router
