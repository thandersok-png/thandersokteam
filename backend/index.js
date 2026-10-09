const express = require('express');
const cors = require('cors');
require('dotenv').config();

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
app.use(cors());
app.use(express.json());

// ==========================================
// 1. Δημιουργία Payment Intent (για πληρωμές)
// ==========================================
app.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency, connectedAccountId } = req.body;
    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    if (
      typeof connectedAccountId !== 'string' ||
      connectedAccountId.trim() === ''
    ) {
      return res.status(400).json({ error: 'Missing connectedAccountId' });
    }

    // Τα ποσά είναι σε λεπτά (smallest currency unit).
    const paymentAmount = Math.round(numericAmount);
    const applicationFee = Math.round(paymentAmount * 0.10);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: paymentAmount,
      currency: currency || 'eur',
      automatic_payment_methods: { enabled: true },
      application_fee_amount: applicationFee,
      transfer_data: {
        destination: connectedAccountId,
      },
    });

    console.log('✅ Payment Intent:', paymentIntent.id);

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('❌ Σφάλμα Payment Intent:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 2. Δημιουργία Connected Account (για ιδιοκτήτες)
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
      refresh_url: 'https://example.com/refresh',
      return_url: 'https://example.com/return',
      type: 'account_onboarding',
    });

    console.log('✅ Account Link URL:', accountLink.url);

    res.json({
      accountId: account.id,
      url: accountLink.url,
    });
  } catch (error) {
    console.error('❌ Σφάλμα Connected Account:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 3. Δημιουργία Transfer (για μεταφορά σε ιδιοκτήτη)
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

    res.json({ transferId: transfer.id });
  } catch (error) {
    console.error('❌ Σφάλμα Transfer:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 4. Εκκίνηση Server
// ==========================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server τρέχει στο http://localhost:${PORT}`);
});