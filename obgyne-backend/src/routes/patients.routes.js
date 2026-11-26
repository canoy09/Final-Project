const express = require('express')
const { listPatients, getPatientRecord, updatePatientRecord } = require('../controllers/patients.controller')
const { requireAuth, requireRole } = require('../middleware/auth')

const router = express.Router()

// Health records are confidential: logged-in DOCTOR accounts only.
// (To also let the secretary view them, change to requireRole('doctor', 'secretary').)
router.use(requireAuth, requireRole('doctor'))

router.get('/', listPatients)
router.get('/:id', getPatientRecord)
router.put('/:id', updatePatientRecord)

module.exports = router
