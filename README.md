# 🛍️ Slipper E-Commerce Platform

A modern full-stack slipper e-commerce platform where customers can discover and purchase slippers without creating an account initially, authenticate using mobile OTP only when checkout is required, and track their orders.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite |
| Backend | Python Flask |
| Database | PostgreSQL (Supabase) |
| Image Storage | Supabase Storage |
| Authentication | Mobile OTP + JWT |

## Project Structure

```
slipper-ecommerce/
├── frontend/          # React + Vite frontend
├── backend/           # Python Flask REST API
├── database/          # Schema reference files
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

- **Python 3.10+**
- **Node.js 18+**
- **Supabase Account** ([supabase.com](https://supabase.com))

### Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
# Edit .env with your Supabase credentials

# Run development server
python run.py
```

The API will be available at `http://localhost:5000`.

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Environment Variables

Copy `.env` in the backend directory and fill in your Supabase credentials:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Supabase PostgreSQL connection string |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_KEY` | Supabase service role key |
| `SECRET_KEY` | Flask secret key |
| `JWT_SECRET_KEY` | JWT signing key |

## API Endpoints

### Health Check
- `GET /api/health` — API and database status

*More endpoints are added with each sprint.*

## License

MIT
