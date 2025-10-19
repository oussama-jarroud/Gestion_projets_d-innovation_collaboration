🧠 Predictive Maintenance Platform (FastAPI + Next.js + TimescaleDB)
📌 Overview

This project is a predictive maintenance web application designed to monitor industrial machines in real time and predict potential failures using AI-driven analysis of sensor data.

It provides a dashboard for monitoring machines, visualizing sensor data (temperature, vibration, pressure, current), and receiving automatic alerts when anomalies are detected.

🏗️ Tech Stack
🔹 Backend (FastAPI)

FastAPI – high-performance Python API framework

Alembic – database migrations

TimescaleDB – time-series optimized PostgreSQL

Uvicorn – ASGI server

Docker & Docker Compose – containerization for easy setup

🔹 Frontend (Next.js + TypeScript)

Next.js 15 (App Router) – modern React framework

Tailwind CSS – styling

Chart.js – real-time charts for sensor data visualization

Axios – API requests

⚙️ Architecture
project/
 ├── backend/
 │    ├── app/
 │    │    ├── main.py
 │    │    ├── db.py
 │    │    ├── ml/
 │    │    │    └── models.py
 │    │    └── routes/
 │    ├── alembic/
 │    └── Dockerfile
 ├── frontend/
 │    ├── components/
 │    ├── app/
 │    └── package.json
 ├── docker-compose.yml
 ├── .env
 └── README.md

🚀 Installation and Setup
1. Clone the repository
git clone https://github.com/yourusername/Gestion_projets_d-innovation_collaboration.git
cd predictive-maintenance

2. Create .env file at the project root
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=predictive_maintenance_db
DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/predictive_maintenance_db

3. Build and start the containers
docker compose up -d --build

4. Apply Alembic migrations
docker exec -it fastapi_predictive_maintenance bash
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head
exit

5. Access the application

Frontend: http://localhost:3000

Backend API Docs: http://localhost:8000/docs

📊 Features

✅ Machine management (list, details, metadata)
✅ Real-time sensor data visualization with Chart.js
✅ Predictive maintenance alerts
✅ TimescaleDB hypertable for efficient time-series storage
✅ Fully containerized with Docker

🧩 Example Endpoints
Method	Endpoint	Description
GET	/machines/	Retrieve all machines
GET	/machines/{id}/sensor-data/	Retrieve sensor data for a machine
POST	/alerts/	Create a new alert
GET	/alerts/	Retrieve all alerts
🧠 Future Improvements

Integrate AI model for anomaly detection (IsolationForest, RandomForest, etc.)

Add authentication & roles (Admin / Operator)

Deploy backend to Render or Railway, and frontend to Vercel

👨‍💻 Author

JARROUD OUSSAMA
📍 Casablanca, Morocco
📧 jarroudoussama@gmail.com
🔗 https://www.linkedin.com/in/oussamajarroud/
