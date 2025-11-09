# Backend (Node + Express) - News Reader

## Setup
1. `cd backend`
2. `npm install`
3. Copy `.env.example` to `.env` and set values:
   - NEWSAPI_KEY: obtain from https://newsapi.org
   - JWT_SECRET: any random string
   - MONGODB_URI: optional MongoDB connection string (if not provided, server uses in-memory storage)
4. Start server:
   - `npm start` (or `npm run dev` if nodemon installed)

## Endpoints (summary)
- POST /api/auth/register  { name, email, password }
- POST /api/auth/login     { email, password } -> returns { token }
- GET  /api/news?category=general&q=keyword  -> proxies to NewsAPI
- GET  /api/bookmarks      -> get user bookmarks (auth)
- POST /api/bookmarks      -> add bookmark { article }
- DELETE /api/bookmarks/:id -> remove bookmark (auth)
