const mongoose = require('mongoose')

const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  color: {
    type: String,
    default: 'default'   // for colored notes in future
  },
  // ── Soft delete ─────────────────────────────────────
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  },
  // ── Media attachment (Cloudinary) ───────────────────
  attachment: {
    url:          { type: String, default: null },
    type:         { type: String, enum: ['image', 'audio', null], default: null },
    publicId:     { type: String, default: null }  // for cloudinary delete
  }
}, { timestamps: true })

module.exports = mongoose.model('Note', noteSchema)
