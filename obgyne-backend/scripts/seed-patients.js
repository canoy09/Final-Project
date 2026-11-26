// Adds FICTIONAL sample patients, medical histories and check-ups for testing 1.3.1.
// Run once after importing database/1.3.1_patient_records.sql:   npm run seed:patients
// Running it again resets these sample patients (P-0001 to P-0008) back to the sample data.
// Real patient data is never touched.
require('dotenv').config()
const pool = require('../src/config/db')

// Check-up dates are "days ago" so the records always look recent.
function daysAgo(n) {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - n)
  return d.toISOString().slice(0, 10)
}
function daysAhead(n) {
  return daysAgo(-n)
}

const DOCTOR = 'Dra. Sirikit'

const patients = [
  {
    code: 'P-0001', name: 'Maria Santos', birth: '1994-03-12', civil: 'Married', phone: '0917 000 0101',
    email: 'maria.santos@example.com', address: 'Poblacion, Calaca, Batangas', job: 'Teacher',
    emergency: ['Jose Santos', '0917 000 0201'],
    history: {
      bloodType: 'O+', allergies: 'Penicillin', conditions: 'None reported', surgeries: 'None',
      medications: 'Prenatal vitamins, iron supplement', family: 'Mother: hypertension',
      gravida: 2, para: 1, lmp: daysAgo(196), notes: 'First child delivered by normal delivery.',
    },
    checkups: [
      { ago: 70, service: 'Prenatal check-up', kg: 62.4, bp: '110/70', aog: 18, findings: 'Normal fetal heartbeat. Good appetite.', tx: 'Continue vitamins. Increase water intake.', next: 28 },
      { ago: 42, service: 'Prenatal check-up', kg: 64.1, bp: '110/70', aog: 22, findings: 'Fundal height appropriate for age of gestation.', tx: 'Continue vitamins.', next: 28 },
      { ago: 14, service: 'Ultrasound', kg: 66.0, bp: '120/80', aog: 26, findings: 'Fetal growth within normal range.', tx: 'Routine monitoring.', next: 28 },
    ],
  },
  {
    code: 'P-0002', name: 'Angelica Reyes', birth: '1989-07-25', civil: 'Married', phone: '0917 000 0102',
    email: null, address: 'Bagong Tubig, Calaca, Batangas', job: 'Store owner',
    emergency: ['Mark Reyes', '0917 000 0202'],
    history: {
      bloodType: 'A+', allergies: 'None known', conditions: 'Mild anemia (2022)', surgeries: 'Appendectomy (2015)',
      medications: 'Iron supplement', family: 'Father: diabetes', gravida: 3, para: 2, lmp: null, notes: null,
    },
    checkups: [
      { ago: 30, service: 'Pap smear', kg: 58.2, bp: '110/70', aog: null, findings: 'Sample collected. No abnormal findings on examination.', tx: 'Await laboratory result.', next: null },
      { ago: 400, service: 'Family planning consultation', kg: 57.5, bp: '110/70', aog: null, findings: 'Discussed available methods.', tx: 'Patient chose a method after counseling.', next: null },
    ],
  },
  {
    code: 'P-0003', name: 'Joanna Dela Cruz', birth: '1996-11-02', civil: 'Married', phone: '0917 000 0103',
    email: 'joanna.dc@example.com', address: 'Dacanlao, Calaca, Batangas', job: 'Office staff',
    emergency: ['Paolo Dela Cruz', '0917 000 0203'],
    history: {
      bloodType: 'B+', allergies: 'Seafood (rash)', conditions: 'Gestational hypertension (being monitored)', surgeries: 'None',
      medications: 'Prenatal vitamins, calcium', family: 'Mother: hypertension', gravida: 1, para: 0, lmp: daysAgo(224),
      notes: 'Advised to monitor blood pressure at home.',
    },
    checkups: [
      { ago: 7, service: 'Prenatal check-up', kg: 70.2, bp: '130/85', aog: 32, findings: 'Blood pressure slightly elevated. No swelling reported.', tx: 'Low-salt diet. Recheck in one week.', next: 7 },
      { ago: 21, service: 'Prenatal check-up', kg: 69.0, bp: '125/80', aog: 30, findings: 'Normal fetal movement.', tx: 'Continue vitamins.', next: 14 },
      { ago: 49, service: 'Prenatal check-up', kg: 66.8, bp: '120/80', aog: 27, findings: 'Routine visit. No concerns.', tx: 'Continue vitamins.', next: 28 },
    ],
  },
  {
    code: 'P-0004', name: 'Katrina Villanueva', birth: '1992-01-18', civil: 'Single', phone: '0917 000 0104',
    email: null, address: 'Calantas, Calaca, Batangas', job: 'Nurse aide',
    emergency: ['Elena Villanueva', '0917 000 0204'],
    history: {
      bloodType: 'AB+', allergies: 'None known', conditions: 'None reported', surgeries: 'None',
      medications: 'None', family: 'None reported', gravida: 1, para: 0, lmp: daysAgo(150), notes: null,
    },
    checkups: [
      { ago: 3, service: 'Ultrasound', kg: 55.0, bp: '110/70', aog: 21, findings: 'Fetal growth scan normal.', tx: 'Continue routine prenatal care.', next: 30 },
    ],
  },
  // New walk-in patient: no medical history and no check-ups yet (shows the empty states).
  {
    code: 'P-0005', name: 'Rhea Mendoza', birth: '1999-09-30', civil: 'Single', phone: '0917 000 0105',
    email: null, address: 'Puting Bato West, Calaca, Batangas', job: null, emergency: [null, null],
    history: null, checkups: [],
  },
  {
    code: 'P-0006', name: 'Liza Bautista', birth: '1985-05-14', civil: 'Married', phone: '0917 000 0106',
    email: 'liza.b@example.com', address: 'Sampaga, Balayan, Batangas', job: 'Vendor',
    emergency: ['Ramon Bautista', '0917 000 0206'],
    history: {
      bloodType: 'O-', allergies: 'Sulfa drugs', conditions: 'Hypertension', surgeries: 'Cesarean section (2018)',
      medications: 'Maintenance medicine for blood pressure', family: 'Mother: hypertension', gravida: 3, para: 3, lmp: null,
      notes: 'Advised to have regular blood pressure monitoring.',
    },
    checkups: [
      { ago: 90, service: 'Follow-up check-up', kg: 68.0, bp: '135/85', aog: null, findings: 'Blood pressure above target.', tx: 'Medication reviewed. Return for recheck.', next: 30 },
    ],
  },
  {
    code: 'P-0007', name: 'Carla Aquino', birth: '1991-12-08', civil: 'Married', phone: '0917 000 0107',
    email: null, address: 'Pantay, Calaca, Batangas', job: 'Housewife',
    emergency: ['Luis Aquino', '0917 000 0207'],
    history: {
      bloodType: 'A-', allergies: 'None known', conditions: 'None reported', surgeries: 'None',
      medications: 'Iron supplement', family: 'None reported', gravida: 2, para: 2, lmp: null, notes: 'Delivered 5 weeks ago.',
    },
    checkups: [
      { ago: 10, service: 'Post-partum check-up', kg: 63.5, bp: '110/70', aog: null, findings: 'Recovering well. Breastfeeding established.', tx: 'Continue iron supplement.', next: 30 },
      { ago: 38, service: 'Prenatal check-up', kg: 74.0, bp: '115/75', aog: 38, findings: 'Cephalic presentation. Ready for delivery.', tx: 'Go to the clinic when contractions begin.', next: null },
    ],
  },
  {
    code: 'P-0008', name: 'Patricia Ramos', birth: '1995-04-21', civil: 'Married', phone: '0917 000 0108',
    email: 'patricia.r@example.com', address: 'Salong, Calaca, Batangas', job: 'Accountant',
    emergency: ['Daniel Ramos', '0917 000 0208'],
    history: {
      bloodType: 'B-', allergies: 'None known', conditions: 'None reported', surgeries: 'None',
      medications: 'Prenatal vitamins', family: 'Father: diabetes', gravida: 1, para: 0, lmp: daysAgo(140), notes: null,
    },
    checkups: [
      { ago: 5, service: 'Prenatal check-up', kg: 59.3, bp: '105/70', aog: 20, findings: 'Normal. Fundal height appropriate.', tx: 'Continue vitamins.', next: 28 },
    ],
  },
]

async function main() {
  for (const p of patients) {
    await pool.query(
      `INSERT INTO patients
         (patient_code, full_name, birth_date, civil_status, contact_number, email, address, occupation,
          emergency_contact_name, emergency_contact_number)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         full_name = VALUES(full_name), birth_date = VALUES(birth_date), civil_status = VALUES(civil_status),
         contact_number = VALUES(contact_number), email = VALUES(email), address = VALUES(address),
         occupation = VALUES(occupation), emergency_contact_name = VALUES(emergency_contact_name),
         emergency_contact_number = VALUES(emergency_contact_number)`,
      [p.code, p.name, p.birth, p.civil, p.phone, p.email, p.address, p.job, p.emergency[0], p.emergency[1]],
    )
    const [[row]] = await pool.query('SELECT id FROM patients WHERE patient_code = ?', [p.code])

    await pool.query('DELETE FROM medical_histories WHERE patient_id = ?', [row.id])
    if (p.history) {
      const h = p.history
      await pool.query(
        `INSERT INTO medical_histories
           (patient_id, blood_type, allergies, chronic_conditions, past_surgeries, current_medications,
            family_history, gravida, para, last_menstrual_period, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [row.id, h.bloodType, h.allergies, h.conditions, h.surgeries, h.medications, h.family, h.gravida, h.para, h.lmp, h.notes],
      )
    }

    await pool.query('DELETE FROM checkups WHERE patient_id = ?', [row.id])
    for (const c of p.checkups) {
      await pool.query(
        `INSERT INTO checkups
           (patient_id, checkup_date, service, weight_kg, blood_pressure, gestational_age_weeks,
            findings, treatment, next_visit_date, attended_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [row.id, daysAgo(c.ago), c.service, c.kg, c.bp, c.aog, c.findings, c.tx, c.next ? daysAhead(c.next - c.ago) : null, DOCTOR],
      )
    }
    console.log(`Saved ${p.code}  ${p.name}  (${p.checkups.length} check-ups)`)
  }
  await pool.end()
}

main().catch((err) => {
  console.error('Seed failed:', err.message)
  console.error('Did you import database/1.3.1_patient_records.sql first?')
  process.exit(1)
})
