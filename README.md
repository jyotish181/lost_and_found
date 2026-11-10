# Lost & Found (React + Express + PostgreSQL)

Database: **PostgreSQL** (migrated from MongoDB). Frontend is unchanged.

## 1. Requirements
- Node.js 18+ (https://nodejs.org)
- PostgreSQL 13+ and pgAdmin (https://www.postgresql.org/download/)
- Redis and Cloudinary are **optional** (the app falls back automatically)

## 2. Create the database (pgAdmin)
1. Open pgAdmin → Servers → PostgreSQL → enter your `postgres` password.
2. Right-click **Databases → Create → Database…** → name: `lost_and_found` → Save.
3. Create the tables, either way:
   - **pgAdmin:** right-click `lost_and_found` → **Query Tool** → open `backend/database/schema.sql` (folder icon), paste/run with **F5**; or
   - **VS Code terminal:** `npm run db:init` (step 3 below, after `npm install` and `.env`).

Tables: `users`, `items`, `claims`, `notifications`.

## 3. Backend (VS Code terminal)
```bash
cd backend
npm install
copy .env.example .env        # Windows   (Mac/Linux: cp .env.example .env)
```
Open `backend/.env` and set **DB_PASSWORD** (your postgres password) and **JWT_SECRET**. Then:
```bash
npm run db:init               # creates the tables (skip if you ran schema.sql in pgAdmin)
npm run create-admin          # creates admin@lostandfound.com / admin123
npm run dev                   # starts API on http://localhost:5000
```
You should see: `PostgreSQL Connected: database "lost_and_found"`.

## 4. Frontend (second terminal)
```bash
cd frontend
npm install
npm start                     # opens http://localhost:3000
```

## 5. Login
- Admin: `admin@lostandfound.com` / `admin123`
- Or register a normal user from the Register page.

## Optional
- `backend/testApiEndpoints.js` and `backend/testIntegration.js` – automated checks (`node testApiEndpoints.js`).
- Cloudinary keys in `.env` enable real image hosting; without them images are stored as data URIs.
- Redis (`REDIS_URL`) enables caching/rate-limit storage; without it an in-memory fallback is used.

## Common errors
| Error | Fix |
|---|---|
| `password authentication failed for user "postgres"` | Wrong `DB_PASSWORD` in `backend/.env` |
| `database "lost_and_found" does not exist` | Create it in pgAdmin (step 2) |
| `relation "users" does not exist` | Tables not created – run `npm run db:init` |
| `ECONNREFUSED 127.0.0.1:5432` | PostgreSQL service is not running |
| Logged in but "User not found" | Old MongoDB login token – log out / clear browser storage and log in again |
