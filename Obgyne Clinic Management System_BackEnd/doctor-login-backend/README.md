# OB-GYN Clinic – Doctor Login Backend

This backend implements **doctor login only** for the existing React/Vite login page. It does not include patient, appointment, consultation, or dashboard APIs.

## Requirements 

- Node.js (18 or newer recommended)
- XAMPP with MySQL running
- phpMyAdmin
- Postman (for API testing)

## 1. Create the MySQL database

1. Open XAMPP Control Panel.
2. Start **MySQL**. Apache is not required for the Node.js API.
3. Open `http://localhost/phpmyadmin`.
4. Select the **Import** tab.
5. Choose `database/schema.sql` and click **Import**.

The script creates the `obgyne_clinic` database and the `doctors` table.

## 2. Configure the backend

Open a terminal in this `doctor-login-backend` folder:

```bash
npm install
```

Copy `.env.example` to a new file named `.env`. Edit `.env` to match your local XAMPP MySQL settings.

Typical local XAMPP settings:
- `DB_HOST=127.0.0.1`
- `DB_PORT=3306`
- `DB_USER=root`
- `DB_PASSWORD=` (leave blank only if your local MySQL root account has no password)
- `DB_NAME=obgyne_clinic`

Set `JWT_SECRET` to a long random value (at least 32 characters). Set `DOCTOR_NAME`, `DOCTOR_EMAIL`, and `DOCTOR_PASSWORD` to the account you want to create. Use a strong password; do not use the sample password in a real deployment.

## 3. Create the doctor login account

Run this once after configuring `.env` and importing the database:

```bash
npm run seed:doctor
```

This stores a bcrypt password hash in MySQL, not the plain-text password. Running the command again with the same email updates that account's name and password.

## 4. Start the backend

```bash
npm run dev
```

The API runs at `http://localhost:8000`.

Check it in a browser or Postman:
- Method: `GET`
- URL: `http://localhost:8000/api/health`

Expected response:

```json
{
  "status": "ok",
  "message": "Doctor login API is running."
}
```

## 5. Connect the existing React frontend

In the **frontend project's** `.env` file, change the values to:

```env
VITE_MOCK_AUTH=false
VITE_API_URL=http://localhost:8000/api
```

Restart Vite after changing `.env`:

```bash
npm run dev
```

The existing `src/services/auth.js` already sends `POST /doctor/login` with `{ email, password, remember }` and reads the JSON response, so no login component changes should be needed.

## 6. Test login in Postman

Create a request:

- Method: `POST`
- URL: `http://localhost:8000/api/doctor/login`
- Body → raw → JSON

```json
{
  "email": "doctor@moralmacatangay.test",
  "password": "UseThePasswordYouSetInEnv",
  "remember": true
}
```

Use the exact email and password configured in the backend `.env`.

Successful response (`200 OK`):

```json
{
  "token": "JWT_TOKEN",
  "doctor": {
    "id": 1,
    "name": "Clinic Doctor",
    "email": "doctor@moralmacatangay.test"
  }
}
```

Incorrect credentials return `401 Unauthorized`. Missing email or password returns `400 Bad Request`.

## Important notes

- Keep backend `.env` private. Never upload it to GitHub or share it publicly.
- The backend `.env` is separate from the frontend `.env`.
- Do not put database credentials or `JWT_SECRET` in the React frontend.
- This is a local development setup. Before real clinic use, add HTTPS, backups, access controls, audit logging, and a security/privacy review appropriate for sensitive health information.
