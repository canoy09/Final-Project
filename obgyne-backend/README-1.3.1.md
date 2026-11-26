# 1.3.1 + 1.3.2 Health Record Management (view + edit)

Extends the 1.1.1 login and 1.2.1 schedule. Login, tokens, hashing and the appointments API are unchanged.

## What it does

This document originally covered 1.3.1 (view). The combined implementation now also includes WBS 1.3.2 (edit/update); see `README-1.3.2.md` for the added editing workflow and required audit-table migration.

## What 1.3.1 does (view)

| Requirement | Where |
|---|---|
| Retrieve a patient's record: personal details, medical history, previous check-ups | `GET /api/patients/:id` |
| Search by patient name or ID | `GET /api/patients?search=` |
| Restrict access to authorized admin accounts | `requireAuth` + `requireRole('doctor')` in `patients.routes.js` |
| Searchable patient list (frontend) | `/patients` page |
| Record page in organized sections (frontend) | `/patients/:id` page |
| Understandable message when a record cannot be found | "Patient record not found" screen |

Health records are **doctor only**. A secretary does not see the "Patient Records" tab and the API answers 403.
To let secretaries view them too, change `requireRole('doctor')` to `requireRole('doctor', 'secretary')` in `src/routes/patients.routes.js`, and `canViewRecords` in `AppHeader.jsx` and `App.jsx`.

## Files

Copy each file into the same place in your projects. Backend folder = `obgyne-backend`. Frontend folder = the one containing `index.html` (your `Admin Log in` folder), so the frontend files go under `src/obgyne-admin/src/`.

**Backend (new)**
- `database/1.3.1_patient_records.sql` – tables `patients`, `medical_histories`, `checkups`
- `src/utils/validate.js` – validation helpers (search text, patient ID, page numbers, dates)
- `src/controllers/patients.controller.js`
- `src/routes/patients.routes.js`
- `scripts/seed-patients.js` – 8 fictional sample patients
- `postman/Obgyne-Backend-1.3.1-Patient-Records.postman_collection.json`

**Backend (changed)**
- `src/server.js` – mounts `/api/patients`
- `src/controllers/appointments.controller.js` – now uses `isValidISODate` from `utils/validate.js` (same behaviour)
- `scripts/test-api.js` – smoke test also checks the patient endpoints
- `package.json` – adds `npm run seed:patients`

**Frontend (new)** in `src/obgyne-admin/src/`
- `utils/validators.js` – `isRequired`, `isEmail`, `isPatientCode`, `normalizeSearch`, `validateSearch`
- `utils/format.js` – `formatDate`, `valueOrDash`, `initials`
- `router.js` – tiny router (`navigate`, `usePath`, `linkProps`), no new package
- `services/patients.js` – calls the API
- `components/AppHeader.jsx` + `AppHeader.css` – top bar shared by all pages
- `pages/Patients.jsx`, `pages/PatientRecord.jsx`, `pages/Patients.css`

**Frontend (changed)**
- `App.jsx` – routes: `/schedule`, `/patients`, `/patients/:id` (+ redirects)
- `pages/Schedule.jsx` – uses the shared `AppHeader` (nothing else changed)

## Setup (Windows + XAMPP)

1. Start MySQL in XAMPP.
2. phpMyAdmin -> select `obgyne_clinic` -> **Import** -> `database/1.3.1_patient_records.sql` -> Go. (Existing tables and data are not touched.)
3. In the backend folder: `npm run seed:patients` (adds fictional patients P-0001 to P-0008; running it again resets only those).
4. `npm run dev` (backend) and `npm run dev` (frontend). No new packages are needed.
5. Log in as the **doctor** (`doctor@gmail.com` / `Doctor Clinic`), click **Patient Records**.

## API

All need `Authorization: Bearer <token>` from a doctor login.

`GET /api/patients?search=&page=1&limit=20`
- `search` (optional): name or patient ID. `maria`, `P-0003` and `3` all work. Max 60 characters; letters, numbers, spaces and `. , ' -` only.
- `page` 1 or more, `limit` 1 to 50.
- 200: `{ patients: [{ id, patientCode, fullName, birthDate, age, contactNumber, lastCheckupDate }], total, page, limit }`
- 400: invalid search / page / limit. An empty result is 200 with `patients: []`.

`GET /api/patients/:id` (`:id` = `3` or `P-0003`)
- 200: `{ patient, medicalHistory, checkups }`. `medicalHistory` is `null` when none is recorded. `checkups` is newest first.
- 400: invalid ID. 404: `{ "message": "Patient record not found." }`

Other codes: 401 no or expired token, 403 not a doctor.
Responses send `Cache-Control: no-store` so health data is never cached.

## Validation utils

- Backend `src/utils/validate.js`: each function returns `{ value }` or `{ error }`, so a controller can do
  `const q = parseSearch(req.query.search); if (q.error) return res.status(400).json({ message: q.error })`.
- Frontend `src/utils/validators.js`: each `validate*` returns an error message or `''`. The rules match the backend, so the search box shows the problem before any request is sent.
- Both keep SQL safe: queries use `?` placeholders, and search text is also escaped for `LIKE`.

## Test

- **Postman:** import `postman/Obgyne-Backend-1.3.1-Patient-Records.postman_collection.json`, run requests 1 to 14 in order (login first; it saves the tokens).
- **No Postman:** `npm run smoke` (run `npm run seed:patients` first).

## Notes for the next WBS items

- `patients.patient_code` is set by the seed for now. Patient registration (2.2.1) must generate it (for example `P-` plus the id padded to 4 digits).
- `appointments` still stores `patient_name` as text. Linking it to `patients` can be done in 1.4.1 or 2.2.1.
- `checkups.next_visit_date` and `checkups.id` are ready for the follow-up scheduling (1.4.1). Editing records (1.3.2) will add the "who changed it and when" log.
- The sample patients are fictional. Delete them before using real data: `DELETE FROM patients WHERE patient_code LIKE 'P-000%';`
