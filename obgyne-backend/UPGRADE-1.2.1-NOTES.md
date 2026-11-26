# Backend 1.2.1 upgrade notes

- The original archive DOES contain `src/server.js`. It is updated here to mount `/api/appointments`.
- The original archive does NOT contain `.env.example`; this archive adds one. Keep your real `.env` private.
- `scripts/seed.js` and `scripts/test-api.js` already agree on development login credentials. Both original Postman collections and README were stale; they are corrected to match the seed.
- Keep existing database data. Import only `database/1.2.1_appointments.sql` into `obgyne_clinic`.
- New API: `GET /api/appointments?date=YYYY-MM-DD&status=pending`, protected by the existing `requireAuth` middleware.
- The appointment table is standalone in this phase and stores patient name/contact as fields; it does not yet link to a patient table.
- Development seed credentials are not production credentials. Change them before deployment.
