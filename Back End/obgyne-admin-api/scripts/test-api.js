// Quick check of the 1.1.1 backend without Postman.
// 1) Start the API (npm run dev)   2) In another terminal run:  npm run smoke
// Add --lockout to also test the failed-attempts limit (then run `npm run seed` to unlock).

// ===== EDIT THESE so they match the accounts in scripts/seed.js =====
const DOCTOR = { email: 'doctor@gmail.com', username: 'doctor', password: 'Doctor Clinic' }
const SECRETARY = { email: 'secretary@gmail.com', username: 'secretary', password: 'Secretary Clinic' }
// =====================================================================

const BASE = process.env.API_URL || 'http://localhost:3000/api'
let passed = 0
let failed = 0

async function call(method, path, body, token) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  return { status: res.status, data }
}

function check(name, ok, extra = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : '  ' + extra}`)
  ok ? passed++ : failed++
}

async function main() {
  let r = await call('GET', '/health')
  check('Health check', r.status === 200, JSON.stringify(r))

  r = await call('POST', '/auth/login', { identifier: '', password: '', role: 'doctor' })
  check('Login with empty fields -> 400', r.status === 400, JSON.stringify(r))

  r = await call('POST', '/auth/login', { identifier: DOCTOR.email, password: DOCTOR.password, role: 'secretary' })
  check('Doctor account as secretary -> 401', r.status === 401, JSON.stringify(r))

  r = await call('POST', '/auth/login', { identifier: DOCTOR.email, password: 'wrong', role: 'doctor' })
  check('Wrong password -> 401', r.status === 401, JSON.stringify(r))

  r = await call('POST', '/auth/login', { identifier: DOCTOR.email, password: DOCTOR.password, role: 'doctor' })
  check('Doctor login -> 200 with token', r.status === 200 && !!r.data.token, JSON.stringify(r))
  const doctorToken = r.data.token
  if (!doctorToken) {
    console.log('\nDoctor login failed, so the checks that need a token are skipped.')
    console.log('Check that DOCTOR in this file matches scripts/seed.js, then run "npm run seed" and try again.')
  }

  r = await call('POST', '/auth/login', { identifier: SECRETARY.username, password: SECRETARY.password, role: 'secretary' })
  check('Secretary login by username -> 200', r.status === 200 && !!r.data.token, JSON.stringify(r))
  const secretaryToken = r.data.token

  r = await call('GET', '/auth/me')
  check('/auth/me without token -> 401', r.status === 401, JSON.stringify(r))

  r = await call('GET', '/auth/me', null, doctorToken)
  check('/auth/me with token -> 200', r.status === 200 && r.data.user?.role === 'doctor', JSON.stringify(r))

  r = await call('GET', '/admin/ping', null, 'fake.token.value')
  check('Admin route with fake token -> 401', r.status === 401, JSON.stringify(r))

  r = await call('GET', '/admin/ping', null, doctorToken)
  check('Admin route with real token -> 200', r.status === 200, JSON.stringify(r))

  r = await call('GET', '/admin/doctor-only', null, secretaryToken)
  check('Doctor-only route as secretary -> 403', r.status === 403, JSON.stringify(r))

  r = await call('POST', '/auth/logout', null, doctorToken)
  check('Logout -> 200', r.status === 200, JSON.stringify(r))

  r = await call('GET', '/auth/me', null, doctorToken)
  check('Token after logout -> 401', r.status === 401, JSON.stringify(r))

  if (process.argv.includes('--lockout')) {
    let last
    for (let i = 1; i <= 6; i++) {
      last = await call('POST', '/auth/login', { identifier: SECRETARY.username, password: 'bad', role: 'secretary' })
      console.log(`      attempt ${i}: ${last.status}`)
      if (last.status === 429) break
    }
    check('Too many failed attempts -> 429 with retryAfter', last.status === 429 && last.data.retryAfter > 0, JSON.stringify(last))
    console.log('Run "npm run seed" to unlock the secretary account.')
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  process.exit(failed ? 1 : 0)
}

main().catch((e) => {
  console.error('Could not reach the API. Is "npm run dev" running?', e.message)
  process.exit(1)
})