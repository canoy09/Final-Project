const express = require('express')
const { requireAuth, requireRole } = require('../middleware/auth')

const router = express.Router()

// Every route in this file needs a logged-in admin account.
router.use(requireAuth)

// Sample protected routes, to prove access is restricted. Replace with the real features later.
router.get('/ping', (req, res) => {
  res.json({ message: `Hello ${req.admin.name}, you are logged in as ${req.admin.role}.` })
})
router.get('/doctor-only', requireRole('doctor'), (req, res) => {
  res.json({ message: 'Doctor-only area.' })
})

module.exports = router
