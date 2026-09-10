# JobConnect - Full Stack Job Portal

Intermediate-level Job Portal built with React, Node.js, Express, Sequelize and MySQL.

## Roles
1. Job Seeker
2. Employer
3. Admin

## Features
- JWT authentication with bcrypt password hashing
- Role-based authorization
- Job CRUD
- Job search, filters and pagination
- Job Seeker application flow
- Employer applicant management
- Admin dashboard and user management
- MySQL relationships and indexes
- Postman API collection
- Interview preparation documentation
- Demo accounts and jobs

## Project structure
- `backend/` Express REST API
- `frontend/` React + Vite UI
- `postman/` API collection
- `docs/` API, database and interview notes

## Requirements
- Node.js 18+
- MySQL 8+

## 1. Create database
```sql
CREATE DATABASE jobconnect;
```

## 2. Backend
```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

For macOS/Linux use:
```bash
cp .env.example .env
```

Backend runs on `http://localhost:5000`.

## 3. Frontend
Open another terminal:
```bash
cd frontend
npm install
npm run dev
```

Frontend normally runs on `http://localhost:5173`.

## Demo accounts
All demo accounts use password:

`Password@123`

- Admin: `admin@jobconnect.com`
- Employer: `hr@techvista.com`
- Employer: `jobs@cloudnova.com`
- Job Seeker: `seeker@gmail.com`

## Demo flow
1. Login as Job Seeker and browse jobs.
2. Open a job and apply.
3. Login as Employer and open My Jobs.
4. View applicants and change application status.
5. Login as Admin and view dashboard/users.

See `docs/INTERVIEW_GUIDE.md` for project explanation and common interview questions.
