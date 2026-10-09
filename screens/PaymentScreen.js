import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { API_URL } from '../stripe';
import COLORS from '../theme/colors';

export default function PaymentScreen({ route, navigation }) {
  const { spot, hours, totalAmount } = route.params || {};
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(true);
  const [ownerAccountId, setOwnerAccountId] = useState(null);

  useEffect(() => {
    fetchOwnerAccount();
  }, []);

  const fetchOwnerAccount = async () => {
    try {
      // Παίρνουμε το Stripe Account ID του ιδιοκτήτη από τη Firebase
      if (spot?.ownerId) {
        const ownerRef = doc(db, 'users', spot.ownerId);
        const ownerSnap = await getDoc(ownerRef);

        if (ownerSnap.exists()) {
          const ownerData = ownerSnap.data();
          if (ownerData.stripeAccountId) {
            console.log('✅ Owner Stripe Account:', ownerData.stripeAccountId);
            setOwnerAccountId(ownerData.stripeAccountId);
          } else {
            console.warn('⚠️ Ο ιδιοκτήτης δεν έχει συνδέσει Stripe');
          }
        }
      }
    } catch (error) {
      console.error('❌ Σφάλμα φόρτωσης ιδιοκτήτη:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializePaymentSheet = async () => {
    try {
      console.log('💰 Ποσό πληρωμής:', totalAmount, 'λεπτά');

      // Στέλνουμε το spotId στο backend για να βρεθεί ο λογαριασμός Stripe.
      const response = await fetch(`${API_URL}/create-payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: totalAmount,
          currency: 'eur',
          spotId: route.params?.spot?.id,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const { error } = await initPaymentSheet({
        paymentIntentClientSecret: data.clientSecret,
        merchantDisplayName: 'ParkShare',
        allowsDelayedPaymentMethods: false,
      });

      if (error) {
        throw new Error(error.message);
      }

      console.log('✅ Payment sheet initialized');
    } catch (error) {
      console.error('❌ Σφάλμα αρχικοποίησης:', error);
      Alert.alert('Σφάλμα', error.message || 'Δεν μπόρεσε να ξεκινήσει η πληρωμή.');
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    try {
      const { error } = await presentPaymentSheet();

      if (error) {
        if (error.code === 'Canceled') {
          return;
        }
        Alert.alert('Σφάλμα Πληρωμής', error.message);
        return;
      }

      Alert.alert(
        '✅ Επιτυχία!',
        'Η πληρωμή ολοκληρώθηκε. Αποθηκεύεται η κράτηση...',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Χάρτης'),
          },
        ]
      );
    } catch (error) {
      console.error('❌ Σφάλμα πληρωμής:', error);
      Alert.alert('Σφάλμα', 'Κάτι πήγε λάθος με την πληρωμή.');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Φόρτωση...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>💳 Πληρωμή</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Θέση</Text>
        <Text style={styles.value}>{spot?.title || 'Άγνωστη'}</Text>

        <Text style={styles.label}>Ώρες</Text>
        <Text style={styles.value}>{hours || '1'} ώρα(ες)</Text>

        <Text style={styles.label}>Σύνολο</Text>
        <Text style={styles.total}>{(totalAmount / 100).toFixed(2)} €</Text>

        {ownerAccountId ? (
          <Text style={styles.ownerInfo}>✅ Ιδιοκτήτης συνδεδεμένος</Text>
        ) : (
          <Text style={styles.ownerWarning}>
            ⚠️ Ο ιδιοκτήτης δεν έχει συνδέσει Stripe
          </Text>
        )}
      </View>

      <TouchableOpacity
        style={styles.payButton}
        onPress={handlePayment}
        disabled={!ownerAccountId}
      >
        <Text style={styles.payButtonText}>💳 Πληρωμή {(totalAmount / 100).toFixed(2)} €</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 20, paddingTop: 50 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  loadingText: { marginTop: 10, color: COLORS.textLight, fontSize: 16 },
  header: { fontSize: 28, fontWeight: 'bold', color: COLORS.primary, textAlign: 'center', marginBottom: 20 },
  card: { backgroundColor: COLORS.white, padding: 20, borderRadius: 12, marginBottom: 20, elevation: 3 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.textLight, marginTop: 10 },
  value: { fontSize: 16, color: COLORS.text, marginTop: 4 },
  total: { fontSize: 24, fontWeight: 'bold', color: COLORS.secondary, marginTop: 4 },
  ownerInfo: { marginTop: 12, color: '#4CAF50', fontSize: 13, fontStyle: 'italic' },
  ownerWarning: { marginTop: 12, color: '#FF9800', fontSize: 13, fontStyle: 'italic' },
  payButton: { backgroundColor: COLORS.primary, padding: 18, borderRadius: 12, alignItems: 'center', elevation: 3 },
  payButtonText: { color: COLORS.white, fontWeight: 'bold', fontSize: 18 },
});