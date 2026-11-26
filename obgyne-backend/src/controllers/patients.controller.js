// WBS 1.3.1 View patient health records.
const pool = require('../config/db')
const { parsePatientRef, parseSearch, parseIntInRange, escapeLike, isValidISODate } = require('../utils/validate')
const validator = require('validator')

const DATE = (col) => `DATE_FORMAT(${col}, '%Y-%m-%d')`

// GET /api/patients?search=maria&page=1&limit=20
// Search matches the patient's name OR patient ID (P-0001 or just 1).
// Sorted by name so staff can scan the list alphabetically.
async function listPatients(req, res, next) {
  try {
    const search = parseSearch(req.query.search)
    if (search.error) return res.status(400).json({ message: search.error })
    const page = parseIntInRange(req.query.page, { name: 'Page', min: 1, max: 100000, fallback: 1 })
    if (page.error) return res.status(400).json({ message: page.error })
    const limit = parseIntInRange(req.query.limit, { name: 'Limit', min: 1, max: 50, fallback: 20 })
    if (limit.error) return res.status(400).json({ message: limit.error })

    let where = ''
    const values = []
    if (search.value) {
      const conditions = ['p.full_name LIKE ?']
      values.push(`%${escapeLike(search.value)}%`)
      if (/^\d+$/.test(search.value)) {
        conditions.push('p.id = ?')
        values.push(Number(search.value))
      }
      conditions.push('p.patient_code LIKE ?')
      values.push(`${escapeLike(search.value.toUpperCase())}%`)
      where = `WHERE ${conditions.join(' OR ')}`
    }

    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM patients p ${where}`, values)

    const [rows] = await pool.query(
      `SELECT p.id, p.patient_code AS patientCode, p.full_name AS fullName,
              ${DATE('p.birth_date')} AS birthDate,
              TIMESTAMPDIFF(YEAR, p.birth_date, CURDATE()) AS age,
              p.contact_number AS contactNumber,
              (SELECT ${DATE('MAX(c.checkup_date)')} FROM checkups c WHERE c.patient_id = p.id) AS lastCheckupDate
         FROM patients p
         ${where}
        ORDER BY p.full_name ASC, p.id ASC
        LIMIT ? OFFSET ?`,
      [...values, limit.value, (page.value - 1) * limit.value],
    )

    res.set('Cache-Control', 'no-store')
    return res.json({ patients: rows, total, page: page.value, limit: limit.value })
  } catch (err) {
    return next(err)
  }
}

// GET /api/patients/:id   (:id = numeric id or patient code such as P-0001)
// -> { patient, medicalHistory (null if none yet), checkups (newest first) }
async function getPatientRecord(req, res, next) {
  try {
    const ref = parsePatientRef(req.params.id)
    if (!ref) {
      return res.status(400).json({ message: 'Patient ID must be a number or a code like P-0001.' })
    }

    const [patients] = await pool.query(
      `SELECT p.id, p.patient_code AS patientCode, p.full_name AS fullName,
              ${DATE('p.birth_date')} AS birthDate,
              TIMESTAMPDIFF(YEAR, p.birth_date, CURDATE()) AS age,
              p.civil_status AS civilStatus, p.contact_number AS contactNumber, p.email,
              p.address, p.occupation,
              p.emergency_contact_name AS emergencyContactName,
              p.emergency_contact_number AS emergencyContactNumber
         FROM patients p
        WHERE ${ref.type === 'id' ? 'p.id' : 'p.patient_code'} = ?
        LIMIT 1`,
      [ref.value],
    )
    const patient = patients[0]
    if (!patient) {
      return res.status(404).json({ message: 'Patient record not found.' })
    }

    const [histories] = await pool.query(
      `SELECT blood_type AS bloodType, allergies, chronic_conditions AS chronicConditions,
              past_surgeries AS pastSurgeries, current_medications AS currentMedications,
              family_history AS familyHistory, gravida, para,
              ${DATE('last_menstrual_period')} AS lastMenstrualPeriod, notes,
              ${DATE('updated_at')} AS updatedAt
         FROM medical_histories WHERE patient_id = ? LIMIT 1`,
      [patient.id],
    )

    const [checkups] = await pool.query(
      `SELECT id, ${DATE('checkup_date')} AS date, service, weight_kg AS weightKg,
              blood_pressure AS bloodPressure, gestational_age_weeks AS gestationalAgeWeeks,
              findings, treatment, ${DATE('next_visit_date')} AS nextVisitDate,
              attended_by AS attendedBy
         FROM checkups
        WHERE patient_id = ?
        ORDER BY checkup_date DESC, id DESC`,
      [patient.id],
    )

    const [auditHistory] = await pool.query(
      `SELECT a.id, DATE_FORMAT(a.changed_at, '%Y-%m-%d %H:%i:%s') AS changedAt, a.changes,
              COALESCE(ad.full_name, 'Former admin') AS editorName
         FROM patient_record_audit a
         LEFT JOIN admins ad ON ad.id = a.editor_admin_id
        WHERE a.patient_id = ?
        ORDER BY a.changed_at DESC, a.id DESC
        LIMIT 20`,
      [patient.id],
    )

    res.set('Cache-Control', 'no-store') // confidential health data: never cache
    return res.json({
      patient,
      medicalHistory: histories[0] || null,
      checkups: checkups.map((c) => ({ ...c, weightKg: c.weightKg === null ? null : Number(c.weightKg) })),
      auditHistory: auditHistory.map((item) => ({
        ...item,
        changes: typeof item.changes === 'string' ? JSON.parse(item.changes) : item.changes,
      })),
    })
  } catch (err) {
    return next(err)
  }
}



// PUT /api/patients/:id - WBS 1.3.2 Edit and update patient records.
// Personal details and the current medical-history summary are editable.
// Previous check-ups remain historical consultation entries and are read-only.
async function updatePatientRecord(req, res, next) {
  const ref = parsePatientRef(req.params.id)
  if (!ref) {
    return res.status(400).json({ message: 'Patient ID must be a number or a code like P-0001.' })
  }

  const patientInput = req.body?.patient
  const historyInput = req.body?.medicalHistory
  if (!patientInput || typeof patientInput !== 'object' || Array.isArray(patientInput) ||
      !historyInput || typeof historyInput !== 'object' || Array.isArray(historyInput)) {
    return res.status(400).json({ message: 'Patient details and medical history are required.' })
  }

  const clean = (value) => value === null || value === undefined ? null : String(value).trim() || null
  const patient = {
    fullName: clean(patientInput.fullName),
    birthDate: clean(patientInput.birthDate),
    civilStatus: clean(patientInput.civilStatus),
    contactNumber: clean(patientInput.contactNumber),
    email: clean(patientInput.email),
    address: clean(patientInput.address),
    occupation: clean(patientInput.occupation),
    emergencyContactName: clean(patientInput.emergencyContactName),
    emergencyContactNumber: clean(patientInput.emergencyContactNumber),
  }
  const history = {
    bloodType: clean(historyInput.bloodType),
    allergies: clean(historyInput.allergies),
    chronicConditions: clean(historyInput.chronicConditions),
    pastSurgeries: clean(historyInput.pastSurgeries),
    currentMedications: clean(historyInput.currentMedications),
    familyHistory: clean(historyInput.familyHistory),
    gravida: historyInput.gravida === '' || historyInput.gravida === null || historyInput.gravida === undefined
      ? null : Number(historyInput.gravida),
    para: historyInput.para === '' || historyInput.para === null || historyInput.para === undefined
      ? null : Number(historyInput.para),
    lastMenstrualPeriod: clean(historyInput.lastMenstrualPeriod),
    notes: clean(historyInput.notes),
  }

  if (!patient.fullName || patient.fullName.length > 150) {
    return res.status(400).json({ message: 'Patient name is required and must be 150 characters or fewer.' })
  }
  if (!isValidISODate(patient.birthDate)) {
    return res.status(400).json({ message: 'Enter a valid date of birth.' })
  }
  if (patient.email && (!validator.isEmail(patient.email) || patient.email.length > 100)) {
    return res.status(400).json({ message: 'Enter a valid email address (100 characters or fewer).' })
  }
  const limits = [
    ['civilStatus', 20], ['contactNumber', 40], ['address', 255], ['occupation', 100],
    ['emergencyContactName', 150], ['emergencyContactNumber', 40],
  ]
  for (const [field, max] of limits) {
    if (patient[field] && patient[field].length > max) {
      return res.status(400).json({ message: `${field} must be ${max} characters or fewer.` })
    }
  }
  const textLimits = [
    ['bloodType', 5], ['allergies', 5000], ['chronicConditions', 5000], ['pastSurgeries', 5000],
    ['currentMedications', 5000], ['familyHistory', 5000], ['notes', 10000],
  ]
  for (const [field, max] of textLimits) {
    if (history[field] && history[field].length > max) {
      return res.status(400).json({ message: `${field} must be ${max} characters or fewer.` })
    }
  }
  for (const field of ['gravida', 'para']) {
    if (history[field] !== null && (!Number.isInteger(history[field]) || history[field] < 0 || history[field] > 20)) {
      return res.status(400).json({ message: `${field} must be a whole number from 0 to 20.` })
    }
  }
  if (history.gravida !== null && history.para !== null && history.para > history.gravida) {
    return res.status(400).json({ message: 'Para cannot be greater than gravida.' })
  }
  if (history.lastMenstrualPeriod && !isValidISODate(history.lastMenstrualPeriod)) {
    return res.status(400).json({ message: 'Enter a valid last menstrual period date.' })
  }

  let connection
  try {
    connection = await pool.getConnection()
    await connection.beginTransaction()

    const [found] = await connection.query(
      `SELECT id FROM patients WHERE ${ref.type === 'id' ? 'id' : 'patient_code'} = ? FOR UPDATE`,
      [ref.value],
    )
    if (!found[0]) {
      await connection.rollback()
      return res.status(404).json({ message: 'Patient record not found.' })
    }
    const patientId = found[0].id

    const [[beforePatient]] = await connection.query(
      `SELECT full_name AS fullName, ${DATE('birth_date')} AS birthDate, civil_status AS civilStatus,
              contact_number AS contactNumber, email, address, occupation,
              emergency_contact_name AS emergencyContactName,
              emergency_contact_number AS emergencyContactNumber
         FROM patients WHERE id = ?`,
      [patientId],
    )
    const [[beforeHistory]] = await connection.query(
      `SELECT blood_type AS bloodType, allergies, chronic_conditions AS chronicConditions,
              past_surgeries AS pastSurgeries, current_medications AS currentMedications,
              family_history AS familyHistory, gravida, para,
              ${DATE('last_menstrual_period')} AS lastMenstrualPeriod, notes
         FROM medical_histories WHERE patient_id = ?`,
      [patientId],
    )

    await connection.query(
      `UPDATE patients SET full_name = ?, birth_date = ?, civil_status = ?, contact_number = ?,
          email = ?, address = ?, occupation = ?, emergency_contact_name = ?,
          emergency_contact_number = ? WHERE id = ?`,
      [patient.fullName, patient.birthDate, patient.civilStatus, patient.contactNumber, patient.email,
        patient.address, patient.occupation, patient.emergencyContactName, patient.emergencyContactNumber, patientId],
    )
    await connection.query(
      `INSERT INTO medical_histories
         (patient_id, blood_type, allergies, chronic_conditions, past_surgeries, current_medications,
          family_history, gravida, para, last_menstrual_period, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         blood_type = VALUES(blood_type), allergies = VALUES(allergies),
         chronic_conditions = VALUES(chronic_conditions), past_surgeries = VALUES(past_surgeries),
         current_medications = VALUES(current_medications), family_history = VALUES(family_history),
         gravida = VALUES(gravida), para = VALUES(para),
         last_menstrual_period = VALUES(last_menstrual_period), notes = VALUES(notes)`,
      [patientId, history.bloodType, history.allergies, history.chronicConditions, history.pastSurgeries,
        history.currentMedications, history.familyHistory, history.gravida, history.para,
        history.lastMenstrualPeriod, history.notes],
    )

    const changes = {}
    const compare = (section, before, after) => {
      for (const [key, value] of Object.entries(after)) {
        const oldValue = before?.[key] ?? null
        if (String(oldValue ?? '') !== String(value ?? '')) {
          changes[`${section}.${key}`] = { from: oldValue, to: value }
        }
      }
    }
    compare('patient', beforePatient, patient)
    compare('medicalHistory', beforeHistory, history)
    if (Object.keys(changes).length) {
      await connection.query(
        'INSERT INTO patient_record_audit (patient_id, editor_admin_id, changes) VALUES (?, ?, ?)',
        [patientId, req.admin.id, JSON.stringify(changes)],
      )
    }

    await connection.commit()
    res.set('Cache-Control', 'no-store')
    return res.json({
      message: Object.keys(changes).length ? 'Patient record updated successfully.' : 'No changes were made.',
      changedFields: Object.keys(changes).length,
    })
  } catch (err) {
    if (connection) await connection.rollback().catch(() => {})
    return next(err)
  } finally {
    if (connection) connection.release()
  }
}

module.exports = { listPatients, getPatientRecord, updatePatientRecord }

