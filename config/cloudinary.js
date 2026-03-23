const cloudinary = require('cloudinary').v2
const { CloudinaryStorage } = require('multer-storage-cloudinary')
const multer = require('multer')

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

// Profile picture storage
const profileStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'notewave/profiles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 400, height: 400, crop: 'fill' }]
  }
})

// Note attachment storage (images + audio)
const noteStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isAudio = file.mimetype.startsWith('audio')
    return {
      folder: 'notewave/notes',
      resource_type: isAudio ? 'video' : 'image', // cloudinary uses 'video' for audio too
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'mp3', 'wav', 'ogg', 'm4a']
    }
  }
})

const uploadProfile = multer({ storage: profileStorage })
const uploadNote    = multer({ storage: noteStorage })

module.exports = { cloudinary, uploadProfile, uploadNote }
