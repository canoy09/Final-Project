# Obgyne Clinic – Admin (Doctor) Front End

Currently built: **Doctor login page** only. Backend is not connected yet.

## Run
```
npm install
npm run dev
```
With `VITE_MOCK_AUTH=true` (in `.env`) you can sign in with
`doctor@womenscare.test` / `doctor123`.

## Connecting your backend later
Edit `src/services/auth.js` – expects `POST {VITE_API_URL}/doctor/login`
returning `{ token, doctor: { id, name, email } }`. Set `VITE_MOCK_AUTH=false`.
