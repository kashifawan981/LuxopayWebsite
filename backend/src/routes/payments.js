import { Router } from 'express';
import Stripe from 'stripe';
import paypal from '@paypal/checkout-server-sdk';
import { v4 as uuidv4 } from 'uuid';
import { recordPaymentEvent, listPaymentsForUser } from '../db.js';

const router = Router();

function getStripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return new Stripe(key, { apiVersion: '2024-06-20' });
}

function getPaypalClient() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials are not configured');
  }
  const environment =
    process.env.PAYPAL_ENV === 'live'
      ? new paypal.core.LiveEnvironment(clientId, clientSecret)
      : new paypal.core.SandboxEnvironment(clientId, clientSecret);
  return new paypal.core.PayPalHttpClient(environment);
}

router.post('/stripe/create-intent', async (req, res) => {
  const { amount, currency = 'usd' } = req.body;
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Amount must be greater than 0' });
  }
  try {
    const stripe = getStripeClient();
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: { enabled: true },
    });

    await recordPaymentEvent({
      id: uuidv4(),
      provider: 'stripe',
      providerReference: paymentIntent.id,
      amount,
      currency,
      status: paymentIntent.status,
      createdAt: new Date().toISOString(),
      userId: req.user?.id ?? null,
      metadata: JSON.stringify({ clientSecret: paymentIntent.client_secret }),
    });

    return res.json({
      clientSecret: paymentIntent.client_secret,
      id: paymentIntent.id,
      status: paymentIntent.status,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/paypal/create-order', async (req, res) => {
  const { amount, currency = 'USD' } = req.body;
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Amount must be greater than 0' });
  }
  try {
    const client = getPaypalClient();
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer('return=representation');
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: (amount / 100).toFixed(2),
          },
        },
      ],
    });

    const response = await client.execute(request);

    await recordPaymentEvent({
      id: uuidv4(),
      provider: 'paypal',
      providerReference: response.result.id,
      amount,
      currency,
      status: response.result.status,
      createdAt: new Date().toISOString(),
      userId: req.user?.id ?? null,
      metadata: JSON.stringify({ links: response.result.links }),
    });

    return res.json({ id: response.result.id, status: response.result.status, links: response.result.links });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get('/history', async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const payments = await listPaymentsForUser(userId);
  return res.json({ payments });
});

export default router;
