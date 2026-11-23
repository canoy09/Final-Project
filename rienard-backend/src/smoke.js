// Quick end-to-end check of the running API.
// 1) Start the server (npm run dev)  2) In another terminal: npm run smoke
import 'dotenv/config'
import { pool } from './db.js'

if (process.env.NODE_ENV === 'production') {
  console.error('Smoke test is disabled in production.')
  process.exit(1)
}

const BASE = process.env.API_URL || `http://localhost:${process.env.PORT || 5000}`
const email = `smoke${Date.now()}@clinic.test`
const password = 'Smoke1234'
let token = ''
let failed = 0

async function call(path, { method = 'GET', body, auth } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (auth) headers.Authorization = `Bearer ${auth}`
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  return { status: res.status, data: await res.json().catch(() => ({})) }
}

async function check(name, expectedStatus, run, extra) {
  try {
    const r = await run()
    const ok = r.status === expectedStatus && (!extra || extra(r.data))
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  (got ${r.status}, expected ${expectedStatus})`)
    if (!ok) failed++
    return r
  } catch (err) {
    console.log(`FAIL  ${name}  (${err.message})`)
    failed++
  }
}

const patient = { firstName: 'Smoke', lastName: 'Test', email, phone: '09171234500', password }

console.log(`Smoke testing ${BASE}\n`)

await check('Health check', 200, () => call('/api/health'))
await check('Register new patient', 201, () => call('/api/patients/register', { method: 'POST', body: patient }))
await check('Register duplicate email', 409, () => call('/api/patients/register', { method: 'POST', body: patient }))
await check('Register weak password', 400, () =>
  call('/api/patients/register', { method: 'POST', body: { ...patient, email: `weak${email}`, password: 'abc' } }))
await check('Register missing fields', 400, () =>
  call('/api/patients/register', { method: 'POST', body: { email } }))

const login = await check('Login with correct password', 200,
  () => call('/api/patients/login', { method: 'POST', body: { email, password } }),
  (d) => Boolean(d.token))
token = login?.data?.token || ''

await check('Login with wrong password', 401, () =>
  call('/api/patients/login', { method: 'POST', body: { email, password: 'WrongPass1' } }))
await check('Login with unknown email', 401, () =>
  call('/api/patients/login', { method: 'POST', body: { email: `nobody${email}`, password } }))
await check('Profile with token', 200, () => call('/api/patients/me', { auth: token }), (d) => d.email === email)
await check('Profile without token', 401, () => call('/api/patients/me'))
await check('Profile with bad token', 401, () => call('/api/patients/me', { auth: 'not-a-real-token' }))

// Clean up the test patient so no junk is left in the database
try {
  await pool.query('DELETE FROM patients WHERE email = ?', [email])
  console.log('\nCleaned up the smoke test patient.')
} catch (err) {
  console.log('\nCould not clean up test patient:', err.code || err.message)
}
await pool.end()

console.log(failed ? `\n${failed} check(s) FAILED.` : '\nAll checks passed.')
process.exit(failed ? 1 : 0)