const express  = require('express')
const router   = express.Router()
const passport = require('passport')
const auth     = require('../middleware/authMiddleware')
const {
  registerUser, verifyEmailOTP, resendVerificationOTP,
  loginUser, verify2FA,
  setup2FA, enable2FA, disable2FA,
  forgotPassword, resetPassword,
  googleCallback
} = require('../controllers/authController')

// Public routes
router.post('/register',           registerUser)
router.post('/verify-email',       verifyEmailOTP)
router.post('/resend-otp',         resendVerificationOTP)
router.post('/login',              loginUser)
router.post('/verify-2fa',         verify2FA)
router.post('/forgot-password',    forgotPassword)
router.post('/reset-password',     resetPassword)

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }))
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login?error=google` }),
  googleCallback
)

// Protected routes
router.get('/setup-2fa',   auth, setup2FA)
router.post('/enable-2fa', auth, enable2FA)
router.post('/disable-2fa', auth, disable2FA)

module.exports = router
