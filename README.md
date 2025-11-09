# Personalized News Reader - Full Project (Minimal)

This archive contains a simple full-stack project (backend + frontend) for a Personalized News Reader Web Application.
It is designed as a minimal working demo you can run locally and extend for your PS-III project.

## Quick start (local)

### Backend
1. `cd backend`
2. `npm install`
3. Copy `.env.example` to `.env` and set `NEWSAPI_KEY` and `JWT_SECRET`. Optionally set `MONGODB_URI`.
4. `npm start` (server runs on port 5000)

### Frontend
1. `cd frontend`
2. `npm install`
3. `npm start` (runs on port 3000)

Frontend expects backend at `http://localhost:5000`. To change, set `REACT_APP_API_BASE` env variable before starting frontend.

## Notes
- If you do not provide MongoDB URI, server uses in-memory storage (data lost on restart).
- Obtain NewsAPI key from https://newsapi.org (free tier).

## Files included
- backend/: Node.js Express backend (auth, news proxy, bookmarks)
- frontend/: React frontend (login, signup, news list, bookmarks)
