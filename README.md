
# Candidate Tracker Dashboard

A responsive, full-stack candidate tracking dashboard that allows you to manage job applicants, filter by status, and update information in real-time.

## 🚀 Features

- View candidate summaries by status
- Search by name, position, or skills
- Sort by name or newest
- Edit or delete candidates
- Filter candidates by recruitment stage
- Fully responsive design

## 🧪 Test Login Credentials

Use the following credentials to log in to the test environment:

```
Email: Test@123test.com  
Password: Testing123
```

> Make sure to log in through the correct login route (check your deployed frontend login page).

## 📦 Tech Stack

- **Frontend**: React, Framer Motion, React Toastify  
- **Backend**: Node.js, Express  
- **Database**: PostgreSQL 
- **API Client**: Axios  
- **Hosting**: Render.com

## 🛠 Getting Started

1. **Clone the repo**  
   ```bash
   git clone https://github.com/mirulasyrani/assessment-task.git
   cd yourrepo
   ```

2. **Install dependencies**  
   ```bash
   npm install
   ```

3. **Create `.env` for backend**  
   ```env
   PORT=5000
   DATABASE_URL=your_db_url
   ```

4. **Run backend**  
   ```bash
   npm run server
   ```

5. **Run frontend**  
   ```bash
   npm start
   ```

> The frontend will run on [Vercel](https://assessment-task-five.vercel.app/) and the backend on [Render](https://assessment-task-1.onrender.com/).

## 📄 API Endpoints

- `GET /api/candidates` – Get all candidates  
- `PUT /api/candidates/:id` – Update candidate  
- `DELETE /api/candidates/:id` – Delete candidate  
- `POST /api/candidates` – Add new candidate  
- `POST /api/logs/frontend-error` – Log frontend errors

## 📸 Screenshots

![Dashboard Screenshot](./screenshots/dashboard.png)

## 📬 Contact

For questions, feel free to reach out via [LinkedIn](https://www.linkedin.com/in/amirulasyrani/) or open an issue in this repository.
