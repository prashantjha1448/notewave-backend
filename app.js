const express = require('express');
const cors = require('cors');
const passport = require('passport');

require('./config/passport');

const app = express();

// ✅ CORS FIX (FINAL)
app.use(cors({
  origin: "https://notewave-frontend.vercel.app",
  credentials: true
}));

app.use(express.json());
app.use(passport.initialize());

// ✅ Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/notes', require('./routes/noteRoutes'));
app.use('/api/user', require('./routes/userRoutes'));

// ✅ Root route (test)
app.get("/", (req, res) => {
  res.send("Notewave API is running 🚀");
});

// ✅ Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Something went wrong!' });
});

module.exports = app;
