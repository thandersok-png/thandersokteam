const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
require('dotenv').config();

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
app.use(cors());
app.use(express.json());

// ==========================================
// 1. Δημιουργία Payment Intent
// ==========================================
app.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency, spotId } = req.body;
    const numericAmount = Number(amount);
    const normalizedSpotId =
      typeof spotId === 'string' ? spotId.trim() : '';

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    if (!normalizedSpotId) {
      return res.status(400).json({ error: 'Missing spotId' });
    }

    // Βρίσκουμε τη θέση στο Firestore και το ownerId της.
    const spotSnapshot = await db
      .collection('spots')
      .doc(normalizedSpotId)
      .get();

    if (!spotSnapshot.exists) {
      return res.status(404).json({ error: 'Spot not found' });
    }

    const { ownerId } = spotSnapshot.data();

    if (typeof ownerId !== 'string' || ownerId.trim() === '') {
      return res.status(400).json({ error: 'Spot has no valid ownerId' });
    }

    // Βρίσκουμε τον χρήστη-ιδιοκτήτη και το Stripe connected account του.
    const ownerSnapshot = await db
      .collection('users')
      .doc(ownerId)
      .get();

    if (!ownerSnapshot.exists) {
      return res.status(404).json({ error: 'Spot owner not found' });
    }

    const { stripeAccountId } = ownerSnapshot.data();

    if (
      typeof stripeAccountId !== 'string' ||
      stripeAccountId.trim() === ''
    ) {
      return res.status(400).json({
        error: 'The spot owner has no connected Stripe account',
      });
    }

    // Τα ποσά είναι σε λεπτά.
    const paymentAmount = Math.round(numericAmount);
    const applicationFee = Math.round(paymentAmount * 0.10);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: paymentAmount,
      currency: currency || 'eur',
      automatic_payment_methods: { enabled: true },
      application_fee_amount: applicationFee,
      transfer_data: {
        destination: stripeAccountId,
      },
    });

    console.log('✅ Payment Intent:', paymentIntent.id);
    console.log('➡️ Transfer to connected account:', stripeAccountId);

    return res.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('❌ Σφάλμα Payment Intent:', error);
    return res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 2. Δημιουργία Connected Account
// ==========================================
app.post('/create-connected-account', async (req, res) => {
  try {
    const { email } = req.body;

    console.log('📥 Λήφθηκε email:', email);

    const account = await stripe.accounts.create({
      type: 'express',
      email: email || 'owner@parkshare.gr',
      country: 'GR',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    console.log('✅ Account ID:', account.id);

    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: 'https://parkshare-backend-oqvr.onrender.com/reauth',
      return_url: 'https://parkshare-backend-oqvr.onrender.com/return',
      type: 'account_onboarding',
    });

    console.log('✅ Account Link URL:', accountLink.url);

    return res.json({
      accountId: account.id,
      url: accountLink.url,
    });
  } catch (error) {
    console.error('❌ Σφάλμα Connected Account:', error);
    return res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 3. Δημιουργία Transfer
// ==========================================
app.post('/create-transfer', async (req, res) => {
  try {
    const { amount, accountId } = req.body;
    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const transfer = await stripe.transfers.create({
      amount: Math.round(numericAmount),
      currency: 'eur',
      destination: accountId,
    });

    console.log('✅ Transfer ID:', transfer.id);

    return res.json({ transferId: transfer.id });
  } catch (error) {
    console.error('❌ Σφάλμα Transfer:', error);
    return res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 4. Εκκίνηση Server
// ==========================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server τρέχει στο http://localhost:${PORT}`);
});