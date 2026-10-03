# Restaurant Ordering & Analytics Platform

A full-stack restaurant ordering system built with Flask and React. Customers can browse a table-based menu, place orders, track status in real time, while kitchen staff and administrators monitor operations and sales through dedicated dashboards.

## Overview

This project combines:

- A customer-facing ordering experience for table-based dining
- Real-time order updates using Socket.IO
- Separate kitchen and admin dashboards
- Menu browsing, cart management, checkout, and tracking flows
- Sales analytics and order history for management
- Recommendation logic for popular and trending menu items

## Tech Stack

### Frontend
- React
- Vite
- React Router
- Framer Motion
- Socket.IO Client
- Recharts
- Tailwind-inspired styling

### Backend
- Flask
- Flask-SQLAlchemy
- Flask-SocketIO
- PostgreSQL
- JWT authentication
- Python recommendations/analytics logic

## Features

### Customer experience
- Table-based menu access using a table number or QR route
- Browse category-based menu items
- View item details and pricing
- Add items to cart and manage quantity
- Checkout flow with order placement
- Track order progress from placement to completion

### Kitchen operations
- Live kitchen dashboard for active orders
- Real-time order status updates
- Task-oriented order processing for staff

### Admin capabilities
- Dashboard overview for restaurant operations
- Analytics for weekly sales and hourly trends
- Access to all orders and historical order records
- Monitoring of restaurant performance through charts and metrics

### Analytics and recommendations
- Trending and popular item calculations
- Weighted popularity scoring based on recency and quantity
- Peak-hour and sales insights for operational decisions

## Project Structure

```text
FinalProject/
├── backend/
│   ├── app/
│   │   ├── algorithms/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   ├── app.py
│   ├── sampledata.py
│   ├── socket_listener.py
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.*
│   └── .env
├── logs/
├── .gitignore
└── README.md
```

## Prerequisites

Before running the project, make sure you have:

- Python 3.10+
- Node.js 18+
- npm
- PostgreSQL database server

## Environment Setup

### Backend
Create or update `backend/.env` with values like:

```env
FLASK_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/restaurantdb
SECRET_KEY=your-secret-key
JWT_SECRET=your-jwt-secret

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@example.com
```

### Frontend
Create or update `frontend/.env` with:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## Installation

### 1. Install backend dependencies

```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate
pip install -r requirements.txt
```

### 2. Install frontend dependencies

```bash
cd frontend
npm install
```

## Running the Application

### Start the backend

```bash
cd backend
python app.py
```

The Flask API and Socket.IO server will run on:

- http://localhost:5000

### Start the frontend

```bash
cd frontend
npm run dev
```

The React app typically runs on:

- http://localhost:5173

## Usage

### Customer flow
1. Open the frontend in the browser.
2. Access the menu through a table route such as `?table=1` or the QR-based session flow.
3. Select dishes and add them to the cart.
4. Proceed to checkout and place the order.
5. Use the tracking page to monitor order progress.

### Staff roles
- Kitchen staff can access the kitchen dashboard.
- Admin users can access analytics and all-order views.
- Login routes are available through the application UI.

## Scripts

### Frontend

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

### Backend
The backend is launched through the Flask app entry point:

```bash
python app.py
```

## Database Notes

This project expects a PostgreSQL database configured through `DATABASE_URL` in `backend/.env`. The application initializes tables automatically on startup using Flask-SQLAlchemy.

## Development Notes

- Socket.IO enables live order updates across customer, kitchen, and admin views.
- The menu is table-aware and uses table validation before ordering.
- The recommendation engine uses sales history and recency-weighted scoring to estimate popularity.

## License

This project is currently for internal or personal use unless otherwise specified by the repository owner.

## Contributing

This is a project-based application; any improvements should be made in a feature branch and validated locally before merging.

