require('dotenv').config()
require('express-async-errors')
const app = require('./app')
const connectDB = require('./config/db')

const PORT = process.env.PORT || 8000

connectDB()


app.get("/", (req, res) => {
  res.send("Notewave API is running 🚀");
});

app.listen(PORT, () => {
  console.log(`🚀 Notewave server running on port ${PORT}`)
})
