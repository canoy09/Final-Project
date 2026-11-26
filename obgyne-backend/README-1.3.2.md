# Obgyne Clinic Management System — WBS 1.3.1 + 1.3.2

This update implements the two related Health Record Management functions together.

## WBS scope

### 1.3.1 View patient health records
- Search patient records by patient name or patient ID.
- View personal details, medical history, and previous check-ups.
- Access is restricted to authenticated doctor accounts.
- Confidential record responses use `Cache-Control: no-store`.

### 1.3.2 Edit and update patient records
- Edit personal details and the current medical-history summary from the patient's record page.
- Validate required fields, dates, email, field lengths, and pregnancy-history numbers on the server.
- Confirm before saving; display success or error feedback.
- Save the editor's admin ID, timestamp, and changed fields in `patient_record_audit`.
- Show the most recent 20 record-change entries on the patient record page.

Previous check-ups are displayed as consultation history and are intentionally read-only in this release. This avoids silently changing historical consultation entries.

## Database setup (XAMPP / phpMyAdmin)

1. Start MySQL in XAMPP.
2. Select the `obgyne_clinic` database.
3. If the 1.3.1 tables have not yet been imported, import `database/1.3.1_patient_records.sql`.
4. Import `database/1.3.2_patient_record_audit.sql` to add the audit table.
5. Do not re-import the 1.3.1 schema just to enable editing if it is already installed; the 1.3.2 migration is additive and preserves existing patient data.
6. From this backend folder, run `npm run seed:patients` only if you need the fictional sample patients. It resets the sample P-0001 to P-0008 records; do not run it against real patient data.

## Start the application

Backend (from the folder containing the backend `package.json`):
```powershell
npm install
npm run dev
```

Frontend (from the folder containing the frontend `package.json`):
```powershell
npm install
npm run dev
```

The frontend `.env` must point `VITE_API_URL` to the backend API base, normally `http://localhost:3000/api`. Restart Vite after changing `.env`.

## API

All patient endpoints require `Authorization: Bearer <doctor-token>`. Secretary accounts receive 403.

- `GET /api/patients?search=&page=1&limit=20` — searchable/paginated list.
- `GET /api/patients/:id` — patient, medical history, previous check-ups, and latest audit history.
- `PUT /api/patients/:id` — update personal details and medical history.

Example PUT body:
```json
{
  "patient": {
    "fullName": "Maria Santos",
    "birthDate": "1994-03-12",
    "civilStatus": "Married",
    "contactNumber": "09170000000",
    "email": "maria@example.com",
    "address": "Calaca, Batangas",
    "occupation": "Teacher",
    "emergencyContactName": "Jose Santos",
    "emergencyContactNumber": "09170000001"
  },
  "medicalHistory": {
    "bloodType": "O+",
    "allergies": "None known",
    "chronicConditions": "None reported",
    "pastSurgeries": "None",
    "currentMedications": "Prenatal vitamins",
    "familyHistory": "Mother: hypertension",
    "gravida": 2,
    "para": 1,
    "lastMenstrualPeriod": "2026-05-01",
    "notes": "Record note"
  }
}
```

`gravida`, `para`, and `lastMenstrualPeriod` may be `null`/empty. `patient.fullName` and `patient.birthDate` are required. The API responds with 400 for invalid input, 404 for an unknown patient, 401 for missing/expired login, and 403 for a non-doctor account.

## Verification

From the backend folder:
```powershell
npm run smoke
```
Run the smoke test while the API is running. It checks the existing login and patient-view flows plus update permissions and update validation. It submits the currently stored values for the first sample patient, so it should not intentionally change that patient's data.

## Files changed for this release

Backend:
- `src/controllers/patients.controller.js`
- `src/routes/patients.routes.js`
- `database/1.3.2_patient_record_audit.sql`
- `scripts/test-api.js`

Frontend:
- `src/obgyne-admin/src/services/patients.js`
- `src/obgyne-admin/src/pages/PatientRecord.jsx`
- `src/obgyne-admin/src/pages/Patients.css`

No new npm package is required; `validator` is already a backend dependency.
