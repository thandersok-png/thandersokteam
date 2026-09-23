const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { setGlobalOptions } = require('firebase-functions/v2');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const Stripe = require('stripe');

initializeApp();
setGlobalOptions({ region: 'us-central1' });

exports.createPaymentIntent = onCall(
  { secrets: ['STRIPE_SECRET_KEY'] },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Απαιτείται σύνδεση.');

    const { bookingId } = request.data || {};
    if (!bookingId) throw new HttpsError('invalid-argument', 'Λείπει το bookingId.');

    const bookingSnapshot = await getFirestore().collection('bookings').doc(bookingId).get();
    if (!bookingSnapshot.exists) throw new HttpsError('not-found', 'Η κράτηση δεν βρέθηκε.');

    const booking = bookingSnapshot.data();
    if (booking.userId !== request.auth.uid) throw new HttpsError('permission-denied', 'Μη έγκυρη κράτηση.');
    if (booking.paid === true) throw new HttpsError('failed-precondition', 'Η κράτηση έχει ήδη πληρωθεί.');

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(Number(booking.totalPrice) * 100),
      currency: 'eur',
      automatic_payment_methods: { enabled: true },
      metadata: { bookingId, userId: request.auth.uid },
    });

    return { paymentIntentClientSecret: paymentIntent.client_secret };
  }
);