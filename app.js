const express = require('express')
const cors = require('cors')
const passport = require('passport')
const app = express()

require('./config/passport')

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}))
app.use(express.json())
app.use(passport.initialize())

// Routes
app.use('/api/auth', require('./routes/authRoutes'))
app.use('/api/notes', require('./routes/noteRoutes'))
app.use('/api/user', require('./routes/userRoutes'))

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ message: err.message || 'Something went wrong!' })
})

module.exports = app
