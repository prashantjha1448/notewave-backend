const Note = require('../models/Note')
const { cloudinary } = require('../config/cloudinary')

// ── GET ALL ACTIVE NOTES (sirf apne user ke) ────────────────────────
const getNotes = async (req, res) => {
  const notes = await Note.find({ user: req.user.id, isDeleted: false }).sort({ createdAt: -1 })
  res.json(notes)
}

// ── GET DELETED NOTES ────────────────────────────────────────────────
const getDeletedNotes = async (req, res) => {
  const notes = await Note.find({ user: req.user.id, isDeleted: true }).sort({ deletedAt: -1 })
  res.json(notes)
}

// ── GET SINGLE NOTE ──────────────────────────────────────────────────
const getSingleNote = async (req, res) => {
  const note = await Note.findOne({ _id: req.params.id, user: req.user.id })
  if (!note) return res.status(404).json({ message: 'Note not found.' })
  res.json(note)
}

// ── CREATE NOTE (with optional media) ───────────────────────────────
const createNote = async (req, res) => {
  const { title, description, color } = req.body

  let attachment = { url: null, type: null, publicId: null }

  if (req.file) {
    const isAudio = req.file.mimetype.startsWith('audio')
    attachment = {
      url:      req.file.path,
      type:     isAudio ? 'audio' : 'image',
      publicId: req.file.filename
    }
  }

  const note = await Note.create({
    title,
    description,
    color: color || 'default',
    user: req.user.id,
    attachment
  })
  res.status(201).json(note)
}

// ── UPDATE NOTE ──────────────────────────────────────────────────────
const updateNote = async (req, res) => {
  const note = await Note.findOne({ _id: req.params.id, user: req.user.id })
  if (!note) return res.status(404).json({ message: 'Note not found.' })

  const { title, description, color } = req.body

  // If new file uploaded, delete old from cloudinary
  if (req.file && note.attachment?.publicId) {
    await cloudinary.uploader.destroy(note.attachment.publicId)
  }

  const updated = await Note.findByIdAndUpdate(
    req.params.id,
    {
      title, description,
      color: color || note.color,
      ...(req.file && {
        attachment: {
          url:      req.file.path,
          type:     req.file.mimetype.startsWith('audio') ? 'audio' : 'image',
          publicId: req.file.filename
        }
      })
    },
    { new: true }
  )
  res.json(updated)
}

// ── SOFT DELETE (move to trash) ──────────────────────────────────────
const deleteNote = async (req, res) => {
  const note = await Note.findOne({ _id: req.params.id, user: req.user.id })
  if (!note) return res.status(404).json({ message: 'Note not found.' })

  note.isDeleted = true
  note.deletedAt = new Date()
  await note.save()

  res.json({ message: 'Note moved to trash.' })
}

// ── RESTORE NOTE ─────────────────────────────────────────────────────
const restoreNote = async (req, res) => {
  const note = await Note.findOne({ _id: req.params.id, user: req.user.id })
  if (!note) return res.status(404).json({ message: 'Note not found.' })

  note.isDeleted = false
  note.deletedAt = null
  await note.save()

  res.json({ message: 'Note restored.', note })
}

// ── PERMANENT DELETE ─────────────────────────────────────────────────
const permanentDelete = async (req, res) => {
  const note = await Note.findOne({ _id: req.params.id, user: req.user.id })
  if (!note) return res.status(404).json({ message: 'Note not found.' })

  // Delete media from cloudinary too
  if (note.attachment?.publicId) {
    const resourceType = note.attachment.type === 'audio' ? 'video' : 'image'
    await cloudinary.uploader.destroy(note.attachment.publicId, { resource_type: resourceType })
  }

  await Note.findByIdAndDelete(req.params.id)
  res.json({ message: 'Note permanently deleted.' })
}

// ── REMOVE ATTACHMENT ────────────────────────────────────────────────
const removeAttachment = async (req, res) => {
  const note = await Note.findOne({ _id: req.params.id, user: req.user.id })
  if (!note) return res.status(404).json({ message: 'Note not found.' })

  if (note.attachment?.publicId) {
    const resourceType = note.attachment.type === 'audio' ? 'video' : 'image'
    await cloudinary.uploader.destroy(note.attachment.publicId, { resource_type: resourceType })
  }

  note.attachment = { url: null, type: null, publicId: null }
  await note.save()

  res.json({ message: 'Attachment removed.', note })
}

module.exports = {
  getNotes, getDeletedNotes, getSingleNote,
  createNote, updateNote,
  deleteNote, restoreNote, permanentDelete,
  removeAttachment
}
