# Luxopay Website (Online Banking)

Challenge in designing all webpages as exact design as our mentor asigned us and adding some animation for attractiveness.

## Backend API

This repository now includes a Node.js backend in the `backend/` folder to support user authentication and payment flows with Stripe or PayPal.

### Quick start

```bash
cd backend
npm install
cp .env.example .env
npm start
```

### Environment variables

Set the following values in `backend/.env`:

- `JWT_SECRET`: secret used to sign auth tokens.
- `STRIPE_SECRET_KEY`: Stripe secret key for payment intents.
- `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET`: PayPal REST API credentials.
- `PAYPAL_ENV`: `sandbox` (default) or `live`.

### API routes

- `POST /api/auth/register`: `{ name, email, password }`
- `POST /api/auth/login`: `{ email, password }`
- `GET /api/auth/me`: requires `Authorization: Bearer <token>`
- `POST /api/payments/stripe/create-intent`: `{ amount, currency }` (amount in cents)
- `POST /api/payments/paypal/create-order`: `{ amount, currency }` (amount in cents)
- `GET /api/payments/history`: list payment events for logged-in user
