import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { collection, addDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { createPaymentIntent } from '../utils/paymentService';
import { PLATFORM_COMMISSION_PERCENT, STRIPE_API_URL } from '../stripe';
import { useStripe } from '@stripe/stripe-react-native';
import { registerForPushNotifications } from '../utils/notifications';

const COLORS = {
  primary: '#1a73e8',
  secondary: '#4CAF50',
  background: '#f5f5f5',
  white: '#ffffff',
  text: '#333333',
  textLight: '#666666',
  border: '#e0e0e0',
  danger: '#e74c3c',
};

export default function BookingScreen({ route, navigation }) {
  const { spot } = route.params || { spot: { title: 'Θέση', price: '1.50' } };
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [hours, setHours] = useState('1');
  const [plateNumber, setPlateNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  // Υπολογισμός τιμών
  const pricePerHour = parseFloat(spot?.price) || 1.5;
  const hourValue = Math.max(1, parseInt(hours || '1', 10) || 1);
  const totalPrice = pricePerHour * hourValue;
  const totalPriceInCents = Math.round(totalPrice * 100);
  const commissionInCents = Math.round(totalPriceInCents * (PLATFORM_COMMISSION_PERCENT / 100));
  const ownerAmountInCents = totalPriceInCents - commissionInCents;

  // Αποστολή ειδοποίησης στον ιδιοκτήτη
  const notifyOwner = async (bookingData) => {
    try {
      const ownerToken = spot?.ownerToken;

      if (!ownerToken) {
        console.log('⚠️ Δεν υπάρχει ownerToken για τη θέση');
        return;
      }

      await fetch(`${STRIPE_API_URL}/notify/new-booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerToken: ownerToken,
          spotTitle: spot.title,
          plateNumber: bookingData.plateNumber,
        }),
      });

      console.log('✅ Ειδοποίηση στάλθηκε στον ιδιοκτήτη');
    } catch (error) {
      console.error('❌ Σφάλμα ειδοποίησης ιδιοκτήτη:', error);
    }
  };

  // Αποστολή ειδοποίησης στον οδηγό (επιβεβαίωση πληρωμής)
  const notifyDriver = async (bookingData) => {
    try {
      const driverToken = await registerForPushNotifications();

      if (!driverToken) {
        console.log('⚠️ Δεν υπάρχει driverToken');
        return;
      }

      await fetch(`${STRIPE_API_URL}/notify/payment-confirmed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverToken: driverToken,
          spotTitle: spot.title,
          amount: bookingData.totalPrice,
          spotCode: spot.spotCode || 'A12',
        }),
      });

      console.log('✅ Ειδοποίηση στάλθηκε στον οδηγό');
    } catch (error) {
      console.error('❌ Σφάλμα ειδοποίησης οδηγού:', error);
    }
  };

  const handleBooking = async () => {
    if (!plateNumber.trim()) {
      Alert.alert('Σφάλμα', 'Συμπληρώστε τον αριθμό κυκλοφορίας.');
      return;
    }

    console.log('💰 spot.price:', pricePerHour);
    console.log('⏱️ hours:', hourValue);
    console.log('💵 totalPrice:', totalPrice);
    console.log('📤 amountInCents:', totalPriceInCents);

    setLoading(true);

    try {
      // 1. Δημιουργία Payment Intent
      const paymentIntent = await createPaymentIntent(totalPriceInCents);

      if (!paymentIntent.clientSecret) {
        throw new Error('Δεν δημιουργήθηκε το payment intent');
      }

      console.log('💳 Client Secret:', paymentIntent.clientSecret);

      // 2. Αρχικοποίηση Payment Sheet
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: paymentIntent.clientSecret,
        merchantDisplayName: 'ParkShare',
      });

      if (initError) {
        throw new Error(initError.message);
      }

      // 3. Άνοιγμα Payment Sheet
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        if (presentError.code === 'Canceled') {
          console.log('⚠️ Ο χρήστης ακύρωσε την πληρωμή');
          setLoading(false);
          return;
        }
        throw new Error(presentError.message);
      }

      console.log('✅ Η πληρωμή ολοκληρώθηκε!');

      // 4. Αποθήκευση κράτησης στο Firestore
      const user = auth.currentUser;
      const booking = {
        spotId: spot.id,
        spotTitle: spot.title,
        userId: user?.uid || 'demo_user',
        userEmail: user?.email || 'demo@test.com',
        date: date.toISOString().split('T')[0],
        startTime: date.toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' }),
        hours: hourValue,
        plateNumber: plateNumber.toUpperCase(),
        totalPrice: totalPrice,
        totalPriceInCents: totalPriceInCents,
        commissionInCents: commissionInCents,
        ownerAmountInCents: ownerAmountInCents,
        paymentIntentId: paymentIntent.id || 'demo',
        status: 'paid',
        createdAt: new Date(),
      };

      const docRef = await addDoc(collection(db, 'bookings'), booking);
      console.log('✅ Κράτηση αποθηκεύτηκε:', docRef.id);

      // 5. Αποστολή ειδοποιήσεων
      await notifyOwner(booking);
      await notifyDriver(booking);

      Alert.alert(
        '✅ Κράτηση & Πληρωμή Ολοκληρώθηκαν!',
        `Κρατήσατε τη θέση "${spot.title}" για ${hourValue} ώρα/ες.\nΠινακίδα: ${plateNumber}\nΣύνολο: ${totalPrice.toFixed(2)} €`,
        [{ text: 'Εντάξει', onPress: () => navigation.navigate('Λίστα') }]
      );
    } catch (error) {
      console.error('❌ Σφάλμα κράτησης/πληρωμής:', error);
      Alert.alert('Σφάλμα πληρωμής', error.message || 'Δεν μπόρεσε να ολοκληρωθεί η κράτηση.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Ακύρωση',
      'Είστε σίγουροι ότι θέλετε να ακυρώσετε την κράτηση;',
      [
        { text: 'Όχι', style: 'cancel' },
        { text: 'Ναι, ακύρωση', style: 'destructive', onPress: () => navigation.goBack() },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      <Text style={styles.header}>📅 Κράτηση Θέσης</Text>

      <View style={styles.spotCard}>
        <Text style={styles.spotTitle}>{spot.title}</Text>
        <Text style={styles.spotAddress}>{spot.address}</Text>
        <Text style={styles.spotPrice}>{pricePerHour} €/ώρα</Text>
      </View>

      <Text style={styles.label}>📆 Ημερομηνία</Text>
      <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
        <Text style={styles.dateButtonText}>{date.toLocaleDateString('el-GR')}</Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) setDate(selectedDate);
          }}
        />
      )}

      <Text style={styles.label}>⏰ Ώρα έναρξης</Text>
      <TouchableOpacity style={styles.dateButton} onPress={() => setShowTimePicker(true)}>
        <Text style={styles.dateButtonText}>
          {date.toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </TouchableOpacity>
      {showTimePicker && (
        <DateTimePicker
          value={date}
          mode="time"
          display="default"
          onChange={(event, selectedDate) => {
            setShowTimePicker(false);
            if (selectedDate) setDate(selectedDate);
          }}
        />
      )}

      <Text style={styles.label}>⏱️ Διάρκεια (ώρες)</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={hours}
        onChangeText={setHours}
        placeholder="π.χ. 2"
      />

      <Text style={styles.label}>🚗 Αριθμός κυκλοφορίας *</Text>
      <TextInput
        style={styles.input}
        placeholder="π.χ. ΝΚΑ-1234"
        value={plateNumber}
        onChangeText={setPlateNumber}
        autoCapitalize="characters"
      />

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Σύνολο</Text>
        <Text style={styles.totalPrice}>{totalPrice.toFixed(2)} €</Text>
      </View>

      <View style={styles.totalCardSecondary}>
        <Text style={styles.totalLabel}>Προμήθεια ParkShare</Text>
        <Text style={styles.totalPrice}>{(commissionInCents / 100).toFixed(2)} €</Text>
      </View>

      <View style={styles.totalCardSecondary}>
        <Text style={styles.totalLabel}>Μεταφορά στον ιδιοκτήτη</Text>
        <Text style={styles.totalPrice}>{(ownerAmountInCents / 100).toFixed(2)} €</Text>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={handleCancel}
        >
          <Text style={styles.cancelButtonText}>❌ Ακύρωση</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.bookButton, loading && styles.disabled]}
          onPress={handleBooking}
          disabled={loading}
        >
          <Text style={styles.bookButtonText}>
            {loading ? '⏳ Πληρωμή...' : '💳 Πληρωμή με Stripe'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: 20, paddingTop: 30, paddingBottom: 120 },
  header: { fontSize: 28, fontWeight: 'bold', color: COLORS.primary, textAlign: 'center', marginBottom: 20 },
  spotCard: { backgroundColor: COLORS.white, padding: 15, borderRadius: 12, marginBottom: 20, elevation: 3 },
  spotTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  spotAddress: { fontSize: 14, color: COLORS.textLight, marginTop: 4 },
  spotPrice: { fontSize: 18, fontWeight: 'bold', color: COLORS.secondary, marginTop: 8 },
  label: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginTop: 16, marginBottom: 8 },
  dateButton: { backgroundColor: COLORS.white, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border },
  dateButtonText: { fontSize: 16, color: COLORS.text },
  input: { backgroundColor: COLORS.white, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, fontSize: 16 },
  totalCard: { backgroundColor: '#e8f0fe', padding: 20, borderRadius: 12, marginTop: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalCardSecondary: { backgroundColor: COLORS.white, padding: 18, borderRadius: 12, marginTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  totalLabel: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  totalPrice: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 30, marginBottom: 60, gap: 10 },
  button: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  cancelButton: { backgroundColor: '#f1f1f1', borderWidth: 1, borderColor: COLORS.border },
  cancelButtonText: { color: COLORS.text, fontWeight: '600' },
  bookButton: { backgroundColor: COLORS.primary },
  disabled: { opacity: 0.6 },
  bookButtonText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16 },
});