const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const User = require('../models/UserModel')
const jwt = require('jsonwebtoken')

passport.use(new GoogleStrategy({
  clientID:     process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL:  process.env.GOOGLE_CALLBACK_URL
},
async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ googleId: profile.id })

    if (!user) {
      // Check if email already registered normally
      user = await User.findOne({ email: profile.emails[0].value })
      if (user) {
        // Link Google account to existing user
        user.googleId = profile.id
        if (!user.profileImage) user.profileImage = profile.photos[0]?.value
        await user.save()
      } else {
        // New user via Google
        user = await User.create({
          userName:     profile.displayName.replace(/\s+/g, '_').toLowerCase(),
          email:        profile.emails[0].value,
          googleId:     profile.id,
          profileImage: profile.photos[0]?.value,
          isVerified:   true,  // Google already verified the email
          password:     'GOOGLE_AUTH_' + Math.random().toString(36)
        })
      }
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' })
    return done(null, { token, user })
  } catch (err) {
    return done(err, null)
  }
}))

module.exports = passport
