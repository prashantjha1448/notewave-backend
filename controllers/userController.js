const User = require('../models/UserModel')
const { cloudinary } = require('../config/cloudinary')

// ── GET PROFILE ──────────────────────────────────────────────────────
const getProfile = async (req, res) => {
  const user = await User.findById(req.user.id).select('-password -emailOtp -emailOtpExpiry -resetPasswordOtp -resetPasswordExpiry -twoFactorSecret')
  if (!user) return res.status(404).json({ message: 'User not found.' })
  res.json(user)
}

// ── UPDATE PROFILE ───────────────────────────────────────────────────
const updateProfile = async (req, res) => {
  const user = await User.findById(req.user.id)
  if (!user) return res.status(404).json({ message: 'User not found.' })

  const { userName } = req.body

  // Check userName taken by someone else
  if (userName && userName !== user.userName) {
    const taken = await User.findOne({ userName })
    if (taken) return res.status(400).json({ message: 'Username already taken.' })
    user.userName = userName
  }

  // New profile picture uploaded
  if (req.file) {
    // Delete old image from cloudinary if exists
    if (user.profileImage) {
      try {
        // Extract publicId from URL
        const parts    = user.profileImage.split('/')
        const filename = parts[parts.length - 1].split('.')[0]
        const publicId = `notewave/profiles/${filename}`
        await cloudinary.uploader.destroy(publicId)
      } catch (e) {
        // Old image delete fail — not critical
      }
    }
    user.profileImage = req.file.path
  }

  await user.save()
  res.json({
    message: 'Profile updated.',
    user: {
      _id: user._id,
      userName: user.userName,
      email: user.email,
      profileImage: user.profileImage,
      twoFactorEnabled: user.twoFactorEnabled,
      twoFactorMethod: user.twoFactorMethod
    }
  })
}

module.exports = { getProfile, updateProfile }
