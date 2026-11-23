# OB-GYN Clinic Backend 1.2.1

This update extends the existing 1.1.1 backend. It preserves the JWT doctor/secretary login, password hashing, logout token revocation, and existing admin tables.

## New feature
`GET /api/appointments?date=YYYY-MM-DD&status=pending`

- Requires `Authorization: Bearer <token>`.
- `date` is optional but must be a real `YYYY-MM-DD` date when supplied.
- `status` is optional and may be `pending`, `approved`, `rejected`, or `completed`.
- Returns `{ "appointments": [...] }` with `id`, `date`, `time`, `patientName`, `status`, `type`, `contact`, and `notes`.
- Results are sorted by appointment date and time.
- An empty database result returns HTTP 200 with an empty array.

## Safe upgrade steps (Windows / XAMPP)

1. Back up your existing `obgyne_clinic` database in phpMyAdmin (Export).
2. Keep your existing backend folder as a backup. Do not delete the old folder yet.
3. Copy the updated source files into your existing backend folder, preserving your real `.env`.
4. Start MySQL in XAMPP.
5. In phpMyAdmin, select/import `database/1.2.1_appointments.sql`. This only creates the new appointments table; it does not drop or recreate admins.
6. If dependencies are not installed, run `npm install`.
7. Ensure your existing `.env` has `PORT=3000`, correct DB settings, a strong `JWT_SECRET`, and `CORS_ORIGIN=http://localhost:5173`.
8. Run `npm run dev`. Check `http://localhost:3000/api/health`.
9. Start the React frontend with `VITE_API_URL=http://localhost:3000/api`. Restart Vite after changing `.env`.
10. Log in using the existing doctor or secretary account.

## Postman

1. Import `postman/Obgyne-Backend-1.2.1.postman_collection.json`.
2. Log in using the existing 1.1.1 collection/request: `POST {{baseUrl}}/auth/login` with `{ "identifier": "your-email", "password": "your-password", "role": "doctor" }`.
3. Copy the returned token into the 1.2.1 collection variable `token`.
4. Set the `date` variable and run requests 1-4.

## Add a test appointment (phpMyAdmin SQL)

Only use fictional test data. Run this after importing the migration:

```sql
INSERT INTO appointments
(patient_name, appointment_date, appointment_time, status, appointment_type, contact, notes)
VALUES
('Sample Patient', CURDATE(), '09:00:00', 'pending', 'Prenatal check-up', '09170000000', 'Fictional test record');
```

Delete the fictional row after testing if no longer needed.

## Notes

- The original `database/schema.sql` is retained for the existing login setup.
- The new migration is additive. Do not re-import or run destructive database reset scripts to upgrade.
- The archive intentionally excludes `node_modules` and `.env`. Keep your own `.env` private and never upload it to GitHub.
- This release implements schedule viewing only. Creating, approving, rejecting, or editing appointments are separate API features.
