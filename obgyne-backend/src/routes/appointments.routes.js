const express = require('express')
const { listAppointments } = require('../controllers/appointments.controller')
const { requireAuth } = require('../middleware/auth')

const router = express.Router()
router.get('/', requireAuth, listAppointments)
module.exports = router
