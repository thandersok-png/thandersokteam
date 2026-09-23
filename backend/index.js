const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { sendPushNotification } = require('./notifications');

const app = express();
app.use(cors());
app.use(express.json());

// ==========================================
// 1. Δημιουργία Payment Intent (για πληρωμές)
// ==========================================
app.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency } = req.body;

    console.log('📥 Λήφθηκε amount:', amount, '| τύπος:', typeof amount);

    const numericAmount = Number(amount);

    if (!numericAmount || isNaN(numericAmount)) {
      console.error('❌ Μη έγκυρο amount:', amount);
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(numericAmount),
      currency: currency || 'eur',
      automatic_payment_methods: { enabled: true },
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

    if (!numericAmount || isNaN(numericAmount)) {
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
// 4. Αποστολή Ειδοποιήσεων
// ==========================================

// Νέα Κράτηση (στον ιδιοκτήτη)
app.post('/notify/new-booking', async (req, res) => {
  try {
    const { ownerToken, spotTitle, plateNumber } = req.body;

    await sendPushNotification(
      [ownerToken],
      '🚗 Νέα Κράτηση!',
      `Κάποιος έκλεισε τη θέση "${spotTitle}". Πινακίδα: ${plateNumber}`,
      { type: 'new_booking' }
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Επιβεβαίωση Πληρωμής (στον οδηγό)
app.post('/notify/payment-confirmed', async (req, res) => {
  try {
    const { driverToken, spotTitle, amount, spotCode } = req.body;

    await sendPushNotification(
      [driverToken],
      '✅ Η πληρωμή πέρασε!',
      `Πλήρωσες ${amount}€ για τη θέση "${spotTitle}". Κωδικός εισόδου: ${spotCode}`,
      { type: 'payment_confirmed' }
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Μεταφορά Χρημάτων (στον ιδιοκτήτη)
app.post('/notify/transfer-complete', async (req, res) => {
  try {
    const { ownerToken, amount, spotTitle } = req.body;

    await sendPushNotification(
      [ownerToken],
      '💰 Πήρες χρήματα!',
      `Η κράτηση στη θέση "${spotTitle}" ολοκληρώθηκε. Μεταφορά: ${amount}€`,
      { type: 'transfer_complete' }
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ακύρωση Κράτησης (στον ιδιοκτήτη)
app.post('/notify/booking-cancelled', async (req, res) => {
  try {
    const { ownerToken, spotTitle } = req.body;

    await sendPushNotification(
      [ownerToken],
      '❌ Ακυρώθηκε η κράτηση',
      `Η κράτηση στη θέση "${spotTitle}" ακυρώθηκε.`,
      { type: 'booking_cancelled' }
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Νέα Αξιολόγηση (στον ιδιοκτήτη)
app.post('/notify/new-review', async (req, res) => {
  try {
    const { ownerToken, rating, comment } = req.body;

    await sendPushNotification(
      [ownerToken],
      `⭐ Νέα αξιολόγηση: ${rating}/5`,
      `Σχόλιο: "${comment || 'Χωρίς σχόλιο'}"`,
      { type: 'new_review' }
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 5. Εκκίνηση Server
// ==========================================
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server τρέχει στο http://localhost:${PORT}`);
});