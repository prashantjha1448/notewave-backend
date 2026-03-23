const express = require('express')
const router  = express.Router()
const auth    = require('../middleware/authMiddleware')
const { uploadNote } = require('../config/cloudinary')
const {
  getNotes, getDeletedNotes, getSingleNote,
  createNote, updateNote,
  deleteNote, restoreNote, permanentDelete,
  removeAttachment
} = require('../controllers/noteController')

router.get('/',                          auth, getNotes)
router.get('/deleted',                   auth, getDeletedNotes)
router.get('/:id',                       auth, getSingleNote)
router.post('/',                         auth, uploadNote.single('attachment'), createNote)
router.put('/:id',                       auth, uploadNote.single('attachment'), updateNote)
router.delete('/:id',                    auth, deleteNote)
router.put('/:id/restore',               auth, restoreNote)
router.delete('/:id/permanent',          auth, permanentDelete)
router.delete('/:id/attachment',         auth, removeAttachment)

module.exports = router
