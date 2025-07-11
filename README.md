
# 🧑‍💼 Recruitment Agency Tracker

A full-stack recruitment management app where recruiters can manage candidates across hiring stages.

---

## 🌐 Live Demo

- 🔗 Frontend: [https://your-frontend.vercel.app](https://your-frontend.vercel.app)
- 🔗 Backend: [https://your-backend-service.onrender.com](https://your-backend-service.onrender.com)

> 🔐 Test Credentials  
Email: `test@example.com`  
Password: `password123`

---

## 📦 Tech Stack

- **Frontend**: React (Hooks), Framer Motion, Toastify
- **Backend**: Node.js + Express
- **Database**: PostgreSQL (Neon)
- **Auth**: JWT + bcryptjs
- **Validation**: Zod
- **Deployment**: Vercel (frontend), Render (backend)

---

## 🚀 Features

- ✅ Register, Login, Logout (JWT auth)
- ✅ Add, Edit, Delete candidates
- ✅ Track candidates by status
- ✅ Filter & search candidates
- ✅ Form validation with Zod
- ✅ Mobile responsive UI
- ✅ Protected routes
- ✅ Error boundary + toast feedback

---

## 🛠 Setup Instructions

```bash
git clone https://github.com/your-username/assessment-task.git
cd assessment-task
```

### 🔧 Backend

```bash
cd backend
npm install
```

Create a `.env` file:

```bash
PORT=5000
DATABASE_URL=postgresql://user:pass@host:port/dbname
JWT_SECRET=your_jwt_secret
```

```bash
# Run migrations (manual example)
psql < schema.sql

# Start server
npm run dev
```

### 💻 Frontend

```bash
cd frontend
npm install
npm start
```

Update `services/api.js`:

```js
axios.defaults.baseURL = 'https://your-backend-service.onrender.com/api';
```

---

## 🧪 API Endpoints

### Auth Routes

| Method | Endpoint             | Description              |
|--------|----------------------|--------------------------|
| POST   | /api/auth/register   | Register new recruiter   |
| POST   | /api/auth/login      | Login recruiter          |
| GET    | /api/auth/me         | Get current user profile |
| POST   | /api/auth/reset-password | Reset password (dev) |

### Candidate Routes (protected)

| Method | Endpoint                    | Description                 |
|--------|-----------------------------|-----------------------------|
| GET    | /api/candidates             | Get all candidates          |
| GET    | /api/candidates/search?q=   | Search by name/position     |
| GET    | /api/candidates/filter?status= | Filter by status         |
| POST   | /api/candidates             | Add candidate               |
| PUT    | /api/candidates/:id         | Update candidate            |
| DELETE | /api/candidates/:id         | Delete candidate            |

---

## 🧾 Candidate Data Schema

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE candidates (
  id SERIAL PRIMARY KEY,
  recruiter_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  position VARCHAR(100) NOT NULL,
  skills TEXT,
  experience_years INTEGER,
  status VARCHAR(20) DEFAULT 'applied' CHECK (
    status IN ('applied', 'screening', 'interview', 'offer', 'hired', 'rejected')
  ),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 📋 Status Workflow

- Applied
- Screening
- Interview
- Offer
- Hired
- Rejected

---

## 📱 UI Screens

- Dashboard with status summary
- Search & filter bar
- Candidate cards
- Candidate form (with validation)
- Dark mode toggle 🌙

---

## ✅ Requirements Covered

- [x] JWT-based auth
- [x] Form validation with Zod
- [x] Protected routes & middleware
- [x] Responsive design
- [x] CRUD + search/filter features
- [x] PostgreSQL with proper schema
- [x] Toasts, error boundaries
- [x] Deployment ready


