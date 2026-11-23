# Obgyne Clinic - 1.1.1 Admin Log In (Backend)

Node.js + Express + MySQL (XAMPP) + CORS. Test with Postman.

## What it does (WBS 1.1.1 backend)

| Requirement | Where |
|---|---|
| Authenticate credentials against the stored admin account | `POST /api/auth/login` (`auth.controller.js`) |
| Verify password using hashing | bcrypt (`bcryptjs`), hashes stored in `admins.password_hash` |
| Create a session or token on success | JWT returned as `token` |
| Restrict all admin features to logged-in admin accounts | `requireAuth` middleware (`middleware/auth.js`), used by `/api/admin/*` |
| Limit repeated failed attempts | 5 wrong passwords locks the account for 60 s (HTTP 429 + `retryAfter`) |
| Support logging out | `POST /api/auth/logout` (token is revoked) |

Roles: `doctor` and `secretary`.

## Setup (Windows + XAMPP)

1. **Start MySQL** in the XAMPP Control Panel (click Start next to MySQL). Apache is only needed to open phpMyAdmin.
2. **Create the database:** open http://localhost/phpmyadmin, click **Import**, choose `database/schema.sql`, click **Go**.
3. **Install packages.** In a terminal inside this folder:
   ```
   npm install
   ```
4. **Create your `.env`:** copy `.env.example` to `.env`. Change `JWT_SECRET` to any long random text. (XAMPP's default MySQL user is `root` with no password, which is already in the example.)
5. **Create the admin accounts:**
   ```
   npm run seed
   ```
   | Role | Email | Username | Password |
   |---|---|---|---|
   | Doctor | doctor@gmail.com | doctor | Doctor Clinic |
   | Secretary | secretary@gmail.com | secretary | Secretary Clinic |

   Running `npm run seed` again resets the passwords and unlocks the accounts.
6. **Start the API:**
   ```
   npm run dev
   ```
   You should see `API running at http://localhost:3000/api` and `Database connected.`

## Test with Postman

1. Postman -> **Import** -> choose `postman/Obgyne-Admin-Login.postman_collection.json`.
2. Open the collection and click **Run**, or send the requests one by one in order (1 to 14). Each request has tests that turn green when the result is correct. Requests 2 and 3 save the tokens automatically.
3. Request 15 tests the failed-attempts limit: send it 5 times. The 5th reply is `429`. Run `npm run seed` to unlock right away (or wait 60 s).

## Connect the React frontend

In the frontend project's `.env`:
```
VITE_API_URL=http://localhost:3000/api
```
Stop and restart `npm run dev` of the frontend (Vite only reads `.env` at start). The login page then uses this API instead of the demo accounts. If your frontend runs on another port, add it to `CORS_ORIGIN` in the backend `.env` and restart the API.

## Endpoints

| Method | URL | Needs token | Notes |
|---|---|---|---|
| GET | /api/health | no | check the API is up |
| POST | /api/auth/login | no | body `{ "identifier", "password", "role" }` -> `{ token, user }` |
| POST | /api/auth/logout | yes | header `Authorization: Bearer <token>` |
| GET | /api/auth/me | yes | current admin |
| GET | /api/admin/ping | yes | sample protected feature |
| GET | /api/admin/doctor-only | yes (doctor) | shows role restriction |

Error codes: `400` missing/invalid input, `401` wrong credentials or bad/expired/logged-out token, `403` wrong role or disabled account, `429` too many failed attempts.

## Common problems

- **"Database NOT connected"**: MySQL is not started in XAMPP, or `schema.sql` was not imported, or `.env` has the wrong password.
- **Port 3306 already used**: another MySQL is running. Stop it, or change the port in XAMPP and `DB_PORT`.
- **CORS error in the browser**: the frontend address is not in `CORS_ORIGIN`. Add it and restart the API.
- **Login says "Incorrect email or password"**: you did not run `npm run seed`, or the role tab does not match the account.


## Backend 1.2.1 - appointment schedule

This release adds `GET /api/appointments` for the admin schedule. It requires the existing JWT Bearer token and supports optional `date=YYYY-MM-DD` and `status=pending|approved|rejected|completed` filters. The response shape is `{ "appointments": [...] }`.

### Upgrade safely
1. Back up the `obgyne_clinic` database in phpMyAdmin.
2. Keep your existing `.env`; do not replace it with the example file.
3. Import `database/1.2.1_appointments.sql` into the existing `obgyne_clinic` database. This only creates the appointments table and does not drop existing tables.
4. Run `npm install` if dependencies are not installed, then `npm run dev`.
5. Set the frontend `VITE_API_URL=http://localhost:3000/api` and restart Vite.

The seed credentials above are development/test credentials. Change them before any real deployment and never commit `.env` or real patient information.
