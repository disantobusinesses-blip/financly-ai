// A simple backend server to securely handle Basiq, Plaid, and Stripe API calls.
require('dotenv').config(); // This line loads variables from your .env file

const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const { Buffer } = require('buffer'); // Import Buffer for Base64 encoding

const app = express();

// --- Load and Sanitize Environment Variables ---
const BASIQ_API_KEY = process.env.BASIQ_API_KEY ? process.env.BASIQ_API_KEY.trim() : null; 
const BASIQ_API_URL = 'https://au-api.basiq.io';
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.trim() : null;
const STRIPE_PRICE_ID_AUD = process.env.STRIPE_PRICE_ID_AUD ? process.env.STRIPE_PRICE_ID_AUD.trim() : null;
const STRIPE_PRICE_ID_USD = process.env.STRIPE_PRICE_ID_USD ? process.env.STRIPE_PRICE_ID_USD.trim() : null;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ? process.env.STRIPE_WEBHOOK_SECRET.trim() : null;
const FRONTEND_URL = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.trim() : 'http://localhost:3000';

// Plaid credentials
const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID ? process.env.PLAID_CLIENT_ID.trim() : null;
const PLAID_SECRET = process.env.PLAID_SECRET ? process.env.PLAID_SECRET.trim() : null;
const PLAID_ENV = process.env.PLAID_ENV ? process.env.PLAID_ENV.trim() : 'sandbox';
// ---------------------------------

// Initialize Stripe
const stripe = require('stripe')(STRIPE_SECRET_KEY);


// --- Middleware Setup ---
app.use(cors({ origin: '*' })); 

app.use((req, res, next) => {
  // Vercel's serverless functions don't run on a persistent server, so logging req/res is less useful here
  // unless you are using Vercel's logging integrations.
  next();
});

// Stripe webhook needs raw body, so we define it before express.json() for that specific route
app.post('/stripe-webhook', express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error(`❌ Webhook signature verification failed: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const userId = session.client_reference_id;
        console.log(`✅ Payment successful for user: ${userId}, session: ${session.id}`);
        // In a real app, you would now update your database to mark the user as 'Pro'.
    }

    res.json({received: true});
});


app.use(express.json());
// ------------------------

// --- API Routes ---
// Vercel maps /api/server.js to /api/* routes automatically.
// We just need to define the endpoints.

app.post('/create-checkout-session', async (req, res) => {
    try {
        const { userId, userEmail, region } = req.body;
        
        if (!userId || !userEmail || !region) {
            return res.status(400).json({ error: { message: "User ID, email, and region are required." }});
        }

        const priceId = region === 'US' ? STRIPE_PRICE_ID_USD : STRIPE_PRICE_ID_AUD;
        if (!priceId) {
             return res.status(400).json({ error: { message: `Pricing is not configured for region: ${region}` }});
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{ price: priceId, quantity: 1 }],
            mode: 'subscription',
            client_reference_id: userId,
            customer_email: userEmail,
            success_url: `${FRONTEND_URL}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${FRONTEND_URL}?payment=cancelled`,
        });

        res.json({ url: session.url });

    } catch (err) {
        console.error('❌ Error creating Stripe checkout session:', err.message);
        res.status(500).json({ error: { message: err.message } });
    }
});

app.post('/create-consent-session', async (req, res) => {
  try {
    const email = (req.body && req.body.email) ? req.body.email.toLowerCase() : `user-${Date.now()}@example.com`;
    const authorizationHeader = `Basic ${BASIQ_API_KEY}`;

    const serverTokRes = await fetch(`${BASIQ_API_URL}/token`, {
      method: 'POST',
      headers: { 
        'Authorization': authorizationHeader, 
        'Content-Type': 'application/x-www-form-urlencoded',
        'basiq-version': '3.0',
      },
      body: new URLSearchParams({ scope: 'SERVER_ACCESS' })
    });
    if (!serverTokRes.ok) throw new Error(`Basiq token error: ${await serverTokRes.text()}`);
    const { access_token: SERVER_TOKEN } = await serverTokRes.json();

    const userRes = await fetch(`${BASIQ_API_URL}/users`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${SERVER_TOKEN}`, 'Content-Type': 'application/json', 'basiq-version': '3.0' },
      body: JSON.stringify({ email })
    });
    if (!userRes.ok && userRes.status !== 409) throw new Error(`Create Basiq user error: ${await userRes.text()}`);
    const user = await userRes.json();

    const clientTokRes = await fetch(`${BASIQ_API_URL}/token`, {
      method: 'POST',
      headers: { 
        'Authorization': authorizationHeader, 
        'Content-Type': 'application/x-www-form-urlencoded',
        'basiq-version': '3.0',
      },
      body: new URLSearchParams({ scope: 'CLIENT_ACCESS', userId: user.id })
    });
    if (!clientTokRes.ok) throw new Error(`Basiq Client token error: ${await clientTokRes.text()}`);
    const { access_token: CLIENT_TOKEN } = await clientTokRes.json();
    
    const consentUrl = `https://consent.basiq.io/home?token=${CLIENT_TOKEN}&action=connect`;
    
    return res.json({ consentUrl, userId: user.id });

  } catch (err) {
    console.error('❌ Error in /api/create-consent-session:', err);
    return res.status(500).json({ error: String(err) });
  }
});

app.get('/basiq-data/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({ error: 'Basiq User ID is required.' });
        }
        
        const authorizationHeader = `Basic ${BASIQ_API_KEY}`;
        const tokenRes = await fetch(`${BASIQ_API_URL}/token`, {
            method: 'POST',
            headers: {
                'Authorization': authorizationHeader,
                'Content-Type': 'application/x-www-form-urlencoded',
                'basiq-version': '3.0',
            },
            body: new URLSearchParams({ scope: 'SERVER_ACCESS' }),
        });
        if (!tokenRes.ok) throw new Error(`Basiq token error: ${await tokenRes.text()}`);
        const { access_token: SERVER_TOKEN } = await tokenRes.json();
        
        const accountsRes = await fetch(`${BASIQ_API_URL}/users/${userId}/accounts`, {
            headers: { 'Authorization': `Bearer ${SERVER_TOKEN}`, 'basiq-version': '3.0' },
        });
        if (!accountsRes.ok) throw new Error(`Basiq accounts fetch error: ${await accountsRes.text()}`);
        const { data: basiqAccounts } = await accountsRes.json();
        
        const transactionsRes = await fetch(`${BASIQ_API_URL}/users/${userId}/transactions`, {
            headers: { 'Authorization': `Bearer ${SERVER_TOKEN}`, 'basiq-version': '3.0' },
        });
        if (!transactionsRes.ok) throw new Error(`Basiq transactions fetch error: ${await transactionsRes.text()}`);
        const { data: basiqTransactions } = await transactionsRes.json();

        const formattedAccounts = basiqAccounts.map(acc => ({
            id: acc.id,
            name: acc.name,
            type: acc.accountType === 'transaction' ? 'Checking' : acc.accountType === 'savings' ? 'Savings' : 'Credit Card',
            balance: parseFloat(acc.balance),
            currency: acc.currency,
        }));
        
        const formattedTransactions = basiqTransactions.map(txn => ({
            id: txn.id,
            accountId: txn.account,
            description: txn.description,
            amount: parseFloat(txn.amount),
            date: txn.postDate,
            category: txn.subClass?.title || 'Uncategorized',
        }));

        res.json({ accounts: formattedAccounts, transactions: formattedTransactions });

    } catch (err) {
        console.error('❌ Error in /api/basiq-data:', err);
        res.status(500).json({ error: String(err) });
    }
});

app.post('/plaid-create-link-token', async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        
        const mockLinkToken = `link-${PLAID_ENV}-mock-token-for-${userId}`;
        
        res.json({ link_token: mockLinkToken });

    } catch (error) {
        console.error("❌ Error in /api/plaid-create-link-token:", error);
        res.status(500).json({ error: 'Failed to create Plaid link token.' });
    }
});

// This is the Vercel export. It allows Vercel to handle the Express app as a serverless function.
module.exports = app;
