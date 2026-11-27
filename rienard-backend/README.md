# Obgyne Clinic Backend (Node.js + Express + MySQL/XAMPP)

## 1. XAMPP
1. Buksan ang XAMPP Control Panel → i-**Start** ang **Apache** at **MySQL**.
2. Pumunta sa http://localhost/phpmyadmin → **Import** → piliin ang `database.sql` → **Go**.
   (Gagawa ito ng database na `obgyne_clinic` at mga table.)

## 2. Node.js
```
cd backend
npm install
copy .env.example .env      (Windows)
npm run dev
```
Dapat lumabas: `API running at http://localhost:5000` at `MySQL connected.`
Palitan ang `JWT_SECRET` sa `.env` ng sarili mong mahabang random text.

## 3. Postman
Import `postman_collection.json`, tapos i-run sa ganitong ayos:
1. Health check
2. Patient register
3. Patient login (kusang nase-save ang token)
4. Get my profile

## 4. Frontend
Sa `Patient/.env`: `VITE_API_URL=http://localhost:5000`
I-restart ang `npm run dev` ng frontend pagkatapos baguhin ang `.env`.

## Endpoints
| Method | URL | Gamit |
|---|---|---|
| POST | /api/patients/register | Sign up |
| POST | /api/patients/login | Log in → `{ token }` |
| GET | /api/patients/me | Profile (kailangan ng Bearer token) |
