# AI-Based Crop Recommendation System

React/Vite frontend, Express/MongoDB API, and Flask/scikit-learn crop prediction service.

## Architecture
Browser → Vercel frontend → Render Node API → Render Flask ML API; Node API also connects to MongoDB Atlas.

## Render deployment
Create a Render Blueprint from this repository using `render.yaml`, or create two Web Services:

### Python ML service
- Root Directory: `backend/ml`
- Build: `pip install -r requirements.txt`
- Start: `gunicorn app:app --bind 0.0.0.0:$PORT`
- Health check: `/health`

Copy its public URL after deployment.

### Node API service
- Root Directory: `backend`
- Build: `npm ci`
- Start: `npm start`
- Health check: `/health`

Configure Render environment variables:
- `NODE_ENV=production`
- `MONGO_URI` = MongoDB Atlas connection string (not localhost)
- `JWT_SECRET` = long random secret
- `ML_SERVICE_URL` = public URL of Python ML service, no trailing slash
- `FRONTEND_URL` = exact Vercel production URL
- `GEMINI_API_KEY`, `WEATHER_API_KEY`, `MANDI_API_KEY` = provider keys; needed only for their respective features

The Node health endpoint should return `status: ok` and `database: connected`.

## Vercel deployment
- Root Directory: `frontend`
- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable `VITE_API_URL` = public Node Render URL (no trailing slash)

Redeploy after setting Vercel environment variables; Vite variables are embedded at build time.

## Local development
Run three terminals:

1. `cd backend/ml`; create/activate a Python venv; `pip install -r requirements.txt`; `python app.py`.
2. Copy `backend/.env.example` to `backend/.env`, set local Mongo URI and secrets; `cd backend`; `npm ci`; `npm start`.
3. Copy `frontend/.env.example` to `frontend/.env`, set `VITE_API_URL=http://localhost:5000`; `cd frontend`; `npm ci`; `npm run dev`.

## Before public launch
- The model was serialized with scikit-learn 1.8.0; requirements pin that version.
- MongoDB Atlas must allow the Render service to connect. Local Compass at `localhost:27017` is not accessible from Render.
- Rotate API keys previously printed in terminal output or committed to Git.
- Never put secrets in `VITE_` frontend variables.
- Farm-history endpoints currently store data in process memory and reset when the server restarts. Persist history in MongoDB before treating it as durable.
