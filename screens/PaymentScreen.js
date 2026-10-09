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
import { db } from '../firebase';
import { createPaymentIntent } from '../utils/paymentService';
import COLORS from '../theme/colors';

export default function PaymentScreen({ route, navigation }) {
  const routeParams = route.params || {};
  const { spot, hours, totalAmount } = routeParams;
  const routeSpotId =
    typeof routeParams.spotId === 'string' ? routeParams.spotId.trim() : '';
  const spotId = routeSpotId || (typeof spot?.id === 'string' ? spot.id.trim() : '');
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(true);
  const [ownerAccountId, setOwnerAccountId] = useState(null);
  const [paymentReady, setPaymentReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initializePayment = async () => {
      try {
        if (spot?.ownerId) {
          const ownerRef = doc(db, 'users', spot.ownerId);
          const ownerSnap = await getDoc(ownerRef);

          if (ownerSnap.exists()) {
            const stripeAccountId = ownerSnap.data().stripeAccountId;
            if (stripeAccountId) {
              console.log('✅ Owner Stripe Account:', stripeAccountId);
              if (mounted) setOwnerAccountId(stripeAccountId);
            } else {
              console.warn('⚠️ Ο ιδιοκτήτης δεν έχει συνδέσει Stripe');
            }
          }
        }

        if (!spotId) {
          throw new Error('Δεν βρέθηκε το ID της θέσης για τη δημιουργία πληρωμής.');
        }

        if (!Number.isFinite(Number(totalAmount)) || Number(totalAmount) <= 0) {
          throw new Error('Το ποσό πληρωμής δεν είναι έγκυρο.');
        }

        console.log('💰 Ποσό πληρωμής:', totalAmount, 'λεπτά');
        const paymentIntent = await createPaymentIntent(totalAmount, spotId);
        if (!paymentIntent.clientSecret) {
          throw new Error('Δεν δημιουργήθηκε το payment intent.');
        }

        const { error } = await initPaymentSheet({
          paymentIntentClientSecret: paymentIntent.clientSecret,
          merchantDisplayName: 'ParkShare',
          allowsDelayedPaymentMethods: false,
        });

        if (error) {
          throw new Error(error.message);
        }

        if (mounted) setPaymentReady(true);
        console.log('✅ Payment sheet initialized');
      } catch (error) {
        console.error('❌ Σφάλμα αρχικοποίησης:', error);
        if (mounted) {
          Alert.alert('Σφάλμα', error.message || 'Δεν μπόρεσε να ξεκινήσει η πληρωμή.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initializePayment();

    return () => {
      mounted = false;
    };
  }, [initPaymentSheet, spot?.ownerId, spotId, totalAmount]);

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
        disabled={!ownerAccountId || !paymentReady}
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