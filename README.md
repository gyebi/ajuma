# Ajuma AI

This repository was reconstructed from the project documents in this folder:

- `Ajuma_AI_Investor_Document.docx`
- `Ajuma_AI_Pitch_Deck.pptx`

Those documents describe a React/Vite frontend, a Node/Express backend, Firebase authentication and storage, OpenAI-powered profile generation, and external job ingestion.

## Rebuilt Structure

- `frontend/`: React + Vite app
- `backend/`: Express API with the documented MVP routes
- `.env.example`: starting environment variables for local development
- `frontend/.env.example`: Vite frontend environment variables for Firebase and the backend URL

## Development Scripts

From the root:

- `npm install`: install all workspace dependencies
- `npm run dev`: run frontend and backend together
- `npm run dev:frontend`: run only the Vite frontend
- `npm run dev:backend`: run only the Express backend
- `npm run build`: build the frontend and run the backend build placeholder
- `npm run start`: start the backend in production mode
- `npm run lint`: lint both workspaces

## Backend Routes

The backend currently includes the API surface explicitly mentioned in the docs:

- `GET /health`
- `GET /protected`
- `POST /resume/upload`
- `POST /ai/generate-profile`
- `GET /ai/ping`
- `POST /jobs/sync`
- `GET /jobs`

Protected routes now require a verified Firebase ID token on the backend, and abuse-prone endpoints are covered by rate limiting. Firebase app initialization on the frontend is also singleton-safe to avoid duplicate initialization during reloads.

## Next Recommended Steps

1. Install dependencies with `npm install`.
2. Add Firebase Admin token verification in `backend/src/server.js`.
3. Connect OpenAI to `/ai/generate-profile` with strict JSON output.
4. Add Arbeitnow job ingestion and persistence to `/jobs/sync`.
5. Expand the frontend into upload, profile, and jobs flows.
