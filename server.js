// A simple backend server to securely handle Basiq, Plaid, and Stripe API calls.
require('dotenv').config(); // This line loads variables from your .env file

// Required packages: express, node-fetch@2, cors, dotenv, stripe
// Run `npm install express node-fetch@2 cors dotenv stripe` in your terminal to install them.

const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const { Buffer } = require('buffer'); // Import Buffer for Base64 encoding

const app = express();
const port = process.env.PORT || 3001;

// --- Load and Sanitize Environment Variables ---
const BASIQ_API_KEY = process.env.BASIQ_API_KEY ? process.env.BASIQ_API_KEY.trim() : null; 
const BASIQ_API_URL = 'https://au-api.basiq.io'; // CORRECTED: Removed /sandbox from the URL to match v3 API docs.
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
  console.log(`[Logger] Request received: ${req.method} ${req.originalUrl}`);
  next();
});

// Stripe webhook needs raw body, so we define it before express.json() for that specific route
app.post('/api/stripe-webhook', express.raw({type: 'application/json'}), async (req, res) => {
    console.log("Stripe webhook received.");
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
        console.log(`User ${userId} has been upgraded to Pro.`);
    }

    res.json({received: true});
});


app.use(express.json());
// ------------------------

// --- Stripe Checkout Session Endpoint ---
app.post('/api/create-checkout-session', async (req, res) => {
    try {
        const { userId, userEmail, region } = req.body;
        
        if (!userId || !userEmail || !region) {
            return res.status(400).json({ error: { message: "User ID, email, and region are required." }});
        }

        const priceId = region === 'US' ? STRIPE_PRICE_ID_USD : STRIPE_PRICE_ID_AUD;
        if (!priceId) {
             return res.status(400).json({ error: { message: `Pricing is not configured for region: ${region}` }});
        }

        console.log(`Creating Stripe checkout session for user: ${userId} in region ${region}`);
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{ price: priceId, quantity: 1 }],
            mode: 'subscription',
            client_reference_id: userId,
            customer_email: userEmail,
            success_url: `${FRONTEND_URL}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${FRONTEND_URL}?payment=cancelled`,
        });

        console.log("✅ Stripe session created:", session.id);
        res.json({ url: session.url });

    } catch (err) {
        console.error('❌ Error creating Stripe checkout session:', err.message);
        res.status(500).json({ error: { message: err.message } });
    }
});


// --- Basiq Consent Session Endpoint ---
app.post('/api/create-consent-session', async (req, res) => {
  try {
    console.log("Received request to create Basiq consent session...");
    const email = (req.body && req.body.email) ? req.body.email.toLowerCase() : `user-${Date.now()}@example.com`;

    const authorizationHeader = `Basic ${BASIQ_API_KEY}`;

    console.log(`Attempting to get Basiq server token from: ${BASIQ_API_URL}/token`);

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
    console.log("Successfully obtained Basiq SERVER_ACCESS token.");

    const userRes = await fetch(`${BASIQ_API_URL}/users`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${SERVER_TOKEN}`, 'Content-Type': 'application/json', 'basiq-version': '3.0' },
      body: JSON.stringify({ email })
    });
    
    if (!userRes.ok && userRes.status !== 409) throw new Error(`Create Basiq user error: ${await userRes.text()}`);
    const user = await userRes.json();
    console.log(`Successfully created or found Basiq user with ID: ${user.id}`);

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
    
    // --- DIAGNOSTIC LOG ---
    console.log(`[DIAGNOSTIC] Generated CLIENT_TOKEN: ${CLIENT_TOKEN ? CLIENT_TOKEN.substring(0, 15) + '...' : 'UNDEFINED'}`);
    console.log("Successfully obtained Basiq CLIENT_ACCESS token.");

    const consentUrl = `https://consent.basiq.io/home?token=${CLIENT_TOKEN}&action=connect`;

    // --- DIAGNOSTIC LOG ---
    console.log(`[DIAGNOSTIC] Final consentUrl constructed: ${consentUrl}`);
    console.log("Successfully created Basiq consent URL.");
    
    return res.json({ consentUrl, userId: user.id });

  } catch (err) {
    console.error('❌ Error in /api/create-consent-session:', err);
    return res.status(500).json({ error: String(err) });
  }
});

// --- Basiq Data Fetching Endpoint ---
app.get('/api/basiq-data/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({ error: 'Basiq User ID is required.' });
        }
        console.log(`Fetching Basiq data for user: ${userId}`);

        // Step 1: Get a fresh SERVER_ACCESS token
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
        
        console.log("Successfully obtained Basiq server token for data fetch.");

        // Step 2: Fetch accounts
        const accountsRes = await fetch(`${BASIQ_API_URL}/users/${userId}/accounts`, {
            headers: { 'Authorization': `Bearer ${SERVER_TOKEN}`, 'basiq-version': '3.0' },
        });
        if (!accountsRes.ok) throw new Error(`Basiq accounts fetch error: ${await accountsRes.text()}`);
        const { data: basiqAccounts } = await accountsRes.json();
        
        console.log(`Fetched ${basiqAccounts.length} accounts.`);

        // Step 3: Fetch transactions
        const transactionsRes = await fetch(`${BASIQ_API_URL}/users/${userId}/transactions`, {
            headers: { 'Authorization': `Bearer ${SERVER_TOKEN}`, 'basiq-version': '3.0' },
        });
        if (!transactionsRes.ok) throw new Error(`Basiq transactions fetch error: ${await transactionsRes.text()}`);
        const { data: basiqTransactions } = await transactionsRes.json();
        
        console.log(`Fetched ${basiqTransactions.length} transactions.`);

        // Step 4: Format data for the frontend
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

        console.log("✅ Successfully fetched and formatted Basiq data.");
        res.json({ accounts: formattedAccounts, transactions: formattedTransactions });

    } catch (err) {
        console.error('❌ Error in /api/basiq-data:', err);
        res.status(500).json({ error: String(err) });
    }
});


// --- Plaid Link Token Endpoint ---
app.post('/api/plaid-create-link-token', async (req, res) => {
    // This is a placeholder for a real Plaid integration.
    // In a real app, you would use the Plaid Node.js client library.
    // 1. Initialize Plaid client: const client = new PlaidApi({ clientID, secret, ... });
    // 2. Create link token request object.
    // 3. Call client.linkTokenCreate(request).
    // 4. Return the link_token to the frontend.
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        console.log(`Received request to create Plaid link token for user: ${userId}`);
        
        // This is a MOCK token. In a real app, this comes from the Plaid API.
        const mockLinkToken = `link-${PLAID_ENV}-mock-token-for-${userId}`;
        console.log("✅ Successfully created MOCK Plaid link token.");
        
        res.json({ link_token: mockLinkToken });

    } catch (error) {
        console.error("❌ Error in /api/plaid-create-link-token:", error);
        res.status(500).json({ error: 'Failed to create Plaid link token.' });
    }
});

// --- 404 Handler ---
// This should be the last middleware to catch all unhandled requests.
app.use((req, res, next) => {
  res.status(404).json({ error: `Not Found: The requested URL ${req.originalUrl} was not found on this server.` });
});


// --- Server Startup Function ---
const startServer = () => {
    app.listen(port, () => {
        console.log(`\nBackend server listening at http://localhost:${port}`);
        console.log("Ready to receive requests from the frontend.");
    });
};

// --- !! CRITICAL STARTUP CHECK !! ---
console.log("--- Server Configuration Check ---");
const basiqKeyOk = BASIQ_API_KEY && BASIQ_API_KEY.length > 10;
const stripeKeyOk = STRIPE_SECRET_KEY && STRIPE_SECRET_KEY.startsWith('sk_');
const stripePriceAudOk = STRIPE_PRICE_ID_AUD && STRIPE_PRICE_ID_AUD.startsWith('price_');
const stripePriceUsdOk = STRIPE_PRICE_ID_USD && STRIPE_PRICE_ID_USD.startsWith('price_');
const stripeWebhookOk = STRIPE_WEBHOOK_SECRET && STRIPE_WEBHOOK_SECRET.startsWith('whsec_');
const plaidClientIdOk = PLAID_CLIENT_ID && PLAID_CLIENT_ID.length > 5;
const plaidSecretOk = PLAID_SECRET && PLAID_SECRET.length > 10;

let allOk = true;

if (basiqKeyOk) console.log("✅ BASIQ_API_KEY loaded."); else { console.error("❌ BASIQ_API_KEY is missing or invalid (for AU)."); allOk = false; }
if (plaidClientIdOk) console.log("✅ PLAID_CLIENT_ID loaded."); else { console.error("❌ PLAID_CLIENT_ID is missing or invalid (for US)."); allOk = false; }
if (plaidSecretOk) console.log("✅ PLAID_SECRET loaded."); else { console.error("❌ PLAID_SECRET is missing or invalid (for US)."); allOk = false; }
if (stripeKeyOk) console.log("✅ STRIPE_SECRET_KEY loaded."); else { console.error("❌ STRIPE_SECRET_KEY is missing or invalid."); allOk = false; }
if (stripePriceAudOk) console.log("✅ STRIPE_PRICE_ID_AUD loaded."); else { console.error("❌ STRIPE_PRICE_ID_AUD is missing or invalid."); allOk = false; }
if (stripePriceUsdOk) console.log("✅ STRIPE_PRICE_ID_USD loaded."); else { console.error("❌ STRIPE_PRICE_ID_USD is missing or invalid."); allOk = false; }
if (stripeWebhookOk) console.log("✅ STRIPE_WEBHOOK_SECRET loaded."); else { console.error("❌ STRIPE_WEBHOOK_SECRET is missing or invalid."); allOk = false; }


if (allOk) {
  console.log("----------------------------------");
  console.log("All configurations are valid.");
  startServer();
} else {
  console.error("\nPlease check your '.env' file for the missing or invalid variables listed above.");
  console.error("The server will not start until all required variables are correctly configured.");
  console.log("----------------------------------");
  process.exit(1);
}