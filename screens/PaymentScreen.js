import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { httpsCallable, getFunctions } from 'firebase/functions';
import { auth, db, app } from '../firebase';

const COLORS = {
  primary: '#1a73e8',
  background: '#f5f5f5',
  text: '#333333',
  muted: '#666666',
  white: '#ffffff',
};

export default function PaymentScreen({ route, navigation }) {
  const { bookingId, amount, spotTitle } = route.params;
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const preparePaymentSheet = async () => {
      try {
        const createPaymentIntent = httpsCallable(getFunctions(app), 'createPaymentIntent');
        const result = await createPaymentIntent({ bookingId });
        const { paymentIntentClientSecret } = result.data;
        const { error: initError } = await initPaymentSheet({
          merchantDisplayName: 'ParkShare',
          paymentIntentClientSecret,
          defaultBillingDetails: { email: auth.currentUser?.email || undefined },
        });

        if (initError) throw new Error(initError.message);
        if (mounted) setReady(true);
      } catch (paymentError) {
        if (mounted) setError(paymentError.message || 'Δεν ήταν δυνατή η προετοιμασία της πληρωμής.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    preparePaymentSheet();
    return () => {
      mounted = false;
    };
  }, [bookingId, initPaymentSheet]);

  const handlePayment = async () => {
    setLoading(true);
    setError('');

    try {
      const { error: paymentError } = await presentPaymentSheet();
      if (paymentError) {
        if (paymentError.code !== 'Canceled') setError(paymentError.message);
        return;
      }

      await setDoc(doc(db, 'payments', bookingId), {
        bookingId,
        userId: auth.currentUser?.uid || null,
        amount: Number(amount),
        currency: 'eur',
        status: 'succeeded',
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, 'bookings', bookingId), { paid: true, paymentStatus: 'succeeded' });
      Alert.alert('Η πληρωμή ολοκληρώθηκε', 'Η κράτησή σας επιβεβαιώθηκε.', [
        { text: 'OK', onPress: () => navigation.navigate('Λίστα') },
      ]);
    } catch (paymentError) {
      setError(paymentError.message || 'Δεν αποθηκεύτηκε η πληρωμή.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Πληρωμή κράτησης</Text>
      <Text style={styles.spot}>{spotTitle}</Text>
      <View style={styles.amountCard}>
        <Text style={styles.amountLabel}>Σύνολο</Text>
        <Text style={styles.amount}>{Number(amount).toFixed(2)} €</Text>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading && !ready ? <ActivityIndicator size="large" color={COLORS.primary} /> : null}
      <TouchableOpacity
        style={[styles.button, (!ready || loading) && styles.disabled]}
        disabled={!ready || loading}
        onPress={handlePayment}
      >
        <Text style={styles.buttonText}>{loading ? 'Προετοιμασία...' : 'Πληρωμή με Stripe'}</Text>
      </TouchableOpacity>
      <Text style={styles.note}>Test mode: 4242 4242 4242 4242</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 24, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.text, textAlign: 'center' },
  spot: { fontSize: 16, color: COLORS.muted, textAlign: 'center', marginTop: 8 },
  amountCard: { backgroundColor: COLORS.white, padding: 24, marginVertical: 24, borderRadius: 12, alignItems: 'center' },
  amountLabel: { fontSize: 16, color: COLORS.muted },
  amount: { fontSize: 32, fontWeight: 'bold', color: COLORS.primary, marginTop: 6 },
  button: { backgroundColor: COLORS.primary, padding: 17, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: COLORS.white, fontSize: 17, fontWeight: 'bold' },
  disabled: { opacity: 0.5 },
  error: { color: '#b71c1c', textAlign: 'center', marginBottom: 16 },
  note: { color: COLORS.muted, textAlign: 'center', marginTop: 18 },
});