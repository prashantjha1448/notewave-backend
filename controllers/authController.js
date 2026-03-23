const User = require('../models/UserModel')
const bcrypt = require('bcryptjs')
const jwt    = require('jsonwebtoken')
const speakeasy = require('speakeasy')
const QRCode    = require('qrcode')
const {
  sendVerificationOTP,
  send2FAOTP,
  sendForgotPasswordOTP,
  generateOTP,
  otpExpiry
} = require('../utils/emailService')

const makeToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' })

// ── REGISTER ────────────────────────────────────────────────────────
const registerUser = async (req, res) => {
  const { userName, email, password } = req.body
  if (!userName || !email || !password)
    return res.status(400).json({ message: 'All fields are required.' })

  const exists = await User.findOne({ $or: [{ email }, { userName }] })
  if (exists) return res.status(400).json({ message: 'Email or username already taken.' })

  const hashed = await bcrypt.hash(password, 10)
  const otp    = generateOTP()
  const expiry = otpExpiry()

  await User.create({
    userName, email,
    password: hashed,
    emailOtp: otp,
    emailOtpExpiry: expiry,
    isVerified: false
  })

  await sendVerificationOTP(email, otp)
  res.status(201).json({ message: 'OTP sent to your email. Please verify.' })
}

// ── VERIFY EMAIL OTP ────────────────────────────────────────────────
const verifyEmailOTP = async (req, res) => {
  const { email, otp } = req.body
  const user = await User.findOne({ email })
  if (!user) return res.status(404).json({ message: 'User not found.' })
  if (user.isVerified) return res.status(400).json({ message: 'Already verified.' })
  if (user.emailOtp !== otp) return res.status(400).json({ message: 'Wrong OTP.' })
  if (user.emailOtpExpiry < new Date()) return res.status(400).json({ message: 'OTP expired. Resend it.' })

  user.isVerified     = true
  user.emailOtp       = null
  user.emailOtpExpiry = null
  await user.save()

  res.json({ message: 'Email verified successfully! You can now login.' })
}

// ── RESEND VERIFICATION OTP ─────────────────────────────────────────
const resendVerificationOTP = async (req, res) => {
  const { email } = req.body
  const user = await User.findOne({ email })
  if (!user) return res.status(404).json({ message: 'User not found.' })
  if (user.isVerified) return res.status(400).json({ message: 'Already verified.' })

  const otp = generateOTP()
  user.emailOtp       = otp
  user.emailOtpExpiry = otpExpiry()
  await user.save()

  await sendVerificationOTP(email, otp)
  res.json({ message: 'OTP resent successfully.' })
}

// ── LOGIN ────────────────────────────────────────────────────────────
const loginUser = async (req, res) => {
  const { email, password } = req.body
  const user = await User.findOne({ email })
  if (!user) return res.status(404).json({ message: 'User not found.' })
  if (!user.isVerified) return res.status(403).json({ message: 'Please verify your email first.', needsVerification: true })

  const isMatch = await bcrypt.compare(password, user.password)
  if (!isMatch) return res.status(400).json({ message: 'Invalid credentials.' })

  // 2FA check
  if (user.twoFactorEnabled) {
    if (user.twoFactorMethod === 'email') {
      const otp = generateOTP()
      user.emailOtp       = otp
      user.emailOtpExpiry = otpExpiry()
      await user.save()
      await send2FAOTP(email, otp)
      return res.json({ message: '2FA OTP sent to email.', requires2FA: true, method: 'email', email })
    }
    if (user.twoFactorMethod === 'totp') {
      return res.json({ message: 'Enter your authenticator code.', requires2FA: true, method: 'totp', email })
    }
  }

  const token = makeToken(user._id)
  res.json({ message: 'Login successful.', token })
}

// ── VERIFY 2FA ───────────────────────────────────────────────────────
const verify2FA = async (req, res) => {
  const { email, otp, method } = req.body
  const user = await User.findOne({ email })
  if (!user) return res.status(404).json({ message: 'User not found.' })

  if (method === 'email') {
    if (user.emailOtp !== otp)       return res.status(400).json({ message: 'Wrong OTP.' })
    if (user.emailOtpExpiry < new Date()) return res.status(400).json({ message: 'OTP expired.' })
    user.emailOtp       = null
    user.emailOtpExpiry = null
    await user.save()
  }

  if (method === 'totp') {
    const valid = speakeasy.totp.verify({
      secret:   user.twoFactorSecret,
      encoding: 'base32',
      token:    otp,
      window:   1
    })
    if (!valid) return res.status(400).json({ message: 'Invalid authenticator code.' })
  }

  const token = makeToken(user._id)
  res.json({ message: 'Login successful.', token })
}

// ── SETUP 2FA (TOTP — get QR code) ──────────────────────────────────
const setup2FA = async (req, res) => {
  const user = await User.findById(req.user.id)
  const secret = speakeasy.generateSecret({ name: `Notewave (${user.email})` })

  user.twoFactorSecret = secret.base32
  await user.save()

  const qrDataUrl = await QRCode.toDataURL(secret.otpauth_url)
  res.json({ qrCode: qrDataUrl, secret: secret.base32 })
}

// ── ENABLE 2FA ───────────────────────────────────────────────────────
const enable2FA = async (req, res) => {
  const { otp, method } = req.body
  const user = await User.findById(req.user.id)

  if (method === 'totp') {
    const valid = speakeasy.totp.verify({
      secret: user.twoFactorSecret, encoding: 'base32', token: otp, window: 1
    })
    if (!valid) return res.status(400).json({ message: 'Invalid code. Try again.' })
  }

  user.twoFactorEnabled = true
  user.twoFactorMethod  = method
  await user.save()
  res.json({ message: `2FA enabled via ${method}.` })
}

// ── DISABLE 2FA ──────────────────────────────────────────────────────
const disable2FA = async (req, res) => {
  const user = await User.findById(req.user.id)
  user.twoFactorEnabled = false
  user.twoFactorMethod  = 'none'
  user.twoFactorSecret  = null
  await user.save()
  res.json({ message: '2FA disabled.' })
}

// ── FORGOT PASSWORD ──────────────────────────────────────────────────
const forgotPassword = async (req, res) => {
  const { email } = req.body
  const user = await User.findOne({ email })
  if (!user) return res.status(404).json({ message: 'No account with this email.' })

  const otp = generateOTP()
  user.resetPasswordOtp    = otp
  user.resetPasswordExpiry = otpExpiry()
  await user.save()

  await sendForgotPasswordOTP(email, otp)
  res.json({ message: 'Password reset OTP sent to your email.' })
}

// ── RESET PASSWORD ───────────────────────────────────────────────────
const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body
  const user = await User.findOne({ email })
  if (!user) return res.status(404).json({ message: 'User not found.' })
  if (user.resetPasswordOtp !== otp)          return res.status(400).json({ message: 'Wrong OTP.' })
  if (user.resetPasswordExpiry < new Date())  return res.status(400).json({ message: 'OTP expired.' })

  user.password            = await bcrypt.hash(newPassword, 10)
  user.resetPasswordOtp    = null
  user.resetPasswordExpiry = null
  await user.save()

  res.json({ message: 'Password reset successfully. You can now login.' })
}

// ── GOOGLE AUTH CALLBACK ─────────────────────────────────────────────
const googleCallback = (req, res) => {
  const { token } = req.user
  res.redirect(`${process.env.FRONTEND_URL}/auth/google?token=${token}`)
}

module.exports = {
  registerUser, verifyEmailOTP, resendVerificationOTP,
  loginUser, verify2FA,
  setup2FA, enable2FA, disable2FA,
  forgotPassword, resetPassword,
  googleCallback
}
