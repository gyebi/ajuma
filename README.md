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
- `npm run tunnel`: start configured ngrok tunnels for frontend and backend
- `npm run dev:tunnel`: run local dev servers and ngrok together
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
- `GET /billing/plans`
- `GET /billing/plans/:planId`
- `GET /billing/entitlement/me`
- `POST /billing/entitlement/consume`
- `POST /payments/initialize`
- `GET /payments/verify/:reference`
- `GET /payments/mine`
- `POST /payments/webhook`

Protected routes require a verified Firebase ID token on the backend, and abuse-prone endpoints are covered by rate limiting. Firebase app initialization on the frontend is singleton-safe to avoid duplicate initialization during reloads.

## Current Pricing

The app currently uses three application-credit plans from the landing page and billing fallback data:

- Starter: 3 applications for GHS 5
- Standard: 7 applications for GHS 10
- Pro: 20 applications for GHS 20

## Production Setup Notes

1. Set `FRONTEND_ORIGIN` on the backend to the production frontend domain.
2. Set `PAYSTACK_CALLBACK_URL` to `https://your-domain.com/payment/callback`.
3. Add the production domain to Firebase Authentication authorized domains.
4. Keep `VITE_BACKEND_URL` in the frontend production environment pointed at the deployed backend.
