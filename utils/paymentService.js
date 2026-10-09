import { API_URL } from '../stripe';

// ==========================================
// 1. Δημιουργία Payment Intent
// ==========================================
export const createPaymentIntent = async (amountInCents, spotId, currency = 'eur') => {
  const normalizedSpotId = typeof spotId === 'string' ? spotId.trim() : '';

  if (!normalizedSpotId) {
    throw new Error('Λείπει το ID της θέσης για τη δημιουργία πληρωμής.');
  }

  console.log('📤 Στέλνω amount:', amountInCents, '| τύπος:', typeof amountInCents);

  try {
    const response = await fetch(`${API_URL}/create-payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountInCents,
        currency: currency,
        spotId: normalizedSpotId,
      }),
    });

    const data = await response.json();
    console.log('📥 Payment Intent Response:', data);

    if (!response.ok) {
      throw new Error(data.error || 'Σφάλμα πληρωμής');
    }

    return data;
  } catch (error) {
    console.error('❌ Σφάλμα Payment Intent:', error);
    throw error;
  }
};

// ==========================================
// 2. Δημιουργία Connected Account
// ==========================================
export const createConnectedAccount = async (email, country = 'GR') => {
  try {
    const response = await fetch(`${API_URL}/create-connected-account`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        country: country,
      }),
    });

    const data = await response.json();
    console.log('📥 Connected Account Response:', data);

    if (!response.ok) {
      throw new Error(data.error || 'Σφάλμα σύνδεσης Stripe');
    }

    if (!data.accountId) {
      throw new Error('Το Stripe δεν επέστρεψε account id.');
    }

    return data;
  } catch (error) {
    console.error('❌ Σφάλμα Connected Account:', error);
    throw error;
  }
};

// ==========================================
// 3. Δημιουργία Transfer
// ==========================================
export const createTransfer = async (amountInCents, accountId) => {
  try {
    const response = await fetch(`${API_URL}/create-transfer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountInCents,
        accountId: accountId,
      }),
    });

    const data = await response.json();
    console.log('📥 Transfer Response:', data);

    if (!response.ok) {
      throw new Error(data.error || 'Σφάλμα μεταφοράς');
    }

    return data;
  } catch (error) {
    console.error('❌ Σφάλμα Transfer:', error);
    throw error;
  }
};