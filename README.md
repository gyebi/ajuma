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
- `POST /webhooks/paystack`

Protected routes require a verified Firebase ID token on the backend, and abuse-prone endpoints are covered by rate limiting. Firebase app initialization on the frontend is singleton-safe to avoid duplicate initialization during reloads.

## Current Pricing

The app currently uses three application-credit plans from the landing page and billing fallback data:

- Starter: 3 applications for GHS 5
- Standard: 7 applications for GHS 10
- Pro: 20 applications for GHS 20

## Production Setup Notes

Use these live URLs:

- Frontend: `https://www.ajuma-ai.com`
- Backend/API: `https://api.ajuma-ai.com`
- Paystack callback: `https://www.ajuma-ai.com/payment/callback`
- Paystack webhook: `https://api.ajuma-ai.com/webhooks/paystack`

Set production environment variables:

- Backend `FRONTEND_ORIGIN=https://www.ajuma-ai.com`
- Backend `PAYSTACK_CALLBACK_URL=https://www.ajuma-ai.com/payment/callback`
- Frontend `VITE_API_BASE_URL=/api`

Also add `www.ajuma-ai.com` to Firebase Authentication authorized domains and configure the Paystack dashboard webhook URL to `https://api.ajuma-ai.com/webhooks/paystack`.
