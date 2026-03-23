const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 30,
    trim: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  profileImage: {
    type: String,
    default: null
  },
  googleId: {
    type: String,
    default: null
  },

  // ── Email Verification ──────────────────────────────
  isVerified: {
    type: Boolean,
    default: false
  },
  emailOtp: {
    type: String,
    default: null
  },
  emailOtpExpiry: {
    type: Date,
    default: null
  },

  // ── 2FA ────────────────────────────────────────────
  twoFactorMethod: {
    type: String,
    enum: ['none', 'email', 'totp'],
    default: 'none'
  },
  twoFactorSecret: {   // for TOTP (Google Authenticator)
    type: String,
    default: null
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },

  // ── Forgot Password ─────────────────────────────────
  resetPasswordOtp: {
    type: String,
    default: null
  },
  resetPasswordExpiry: {
    type: Date,
    default: null
  }

}, { timestamps: true })

module.exports = mongoose.model('User', userSchema)
