import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { createConnectedAccount } from '../utils/paymentService';
import { registerForPushNotifications } from '../utils/notifications';
import COLORS from '../theme/colors';

export default function OwnerStripeSetupScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('');

  // Αποθήκευση pushToken σε όλες τις θέσεις του ιδιοκτήτη
  const saveOwnerTokenToSpots = async (ownerId, token) => {
    try {
      console.log('🔍 Ψάχνω θέσεις για ownerId:', ownerId);

      const q = query(collection(db, 'spots'), where('ownerId', '==', ownerId));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        console.log('⚠️ Δεν βρέθηκαν θέσεις για τον ιδιοκτήτη');
        return;
      }

      let count = 0;
      for (const spotDoc of snapshot.docs) {
        await updateDoc(doc(db, 'spots', spotDoc.id), {
          ownerToken: token,
        });
        count++;
      }

      console.log(`✅ Αποθηκεύτηκε το token σε ${count} θέσεις`);
    } catch (error) {
      console.error('❌ Σφάλμα αποθήκευσης token:', error);
    }
  };

  const handleConnectStripe = async () => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      Alert.alert('Σφάλμα', 'Πρέπει να είστε συνδεδεμένοι.');
      return;
    }

    setLoading(true);
    setStatusText('Δημιουργώ τον Stripe λογαριασμό σου...');

    try {
      // 1. Παίρνουμε το push token
      const pushToken = await registerForPushNotifications();
      console.log('📱 Push Token:', pushToken);

      // 2. Δημιουργία Connected Account
      const result = await createConnectedAccount(
        currentUser.email || `${currentUser.uid}@parkshare.app`,
        'GR'
      );

      console.log('✅ Connected Account Result:', result);

      const connectedAccountId = result.accountId || result.account?.id;
      const onboardingUrl = result.url || result.onboardingUrl;

      if (!connectedAccountId) {
        throw new Error('Το Stripe δεν επέστρεψε account id.');
      }

      // 3. Αποθήκευση του connectedAccountId στον χρήστη
      await updateDoc(doc(db, 'users', currentUser.uid), {
        stripeAccountId: connectedAccountId,
      });

      // 4. Αποθήκευση του pushToken σε όλες τις θέσεις του ιδιοκτήτη
      if (pushToken) {
        await saveOwnerTokenToSpots(currentUser.uid, pushToken);
      }

      // 5. Άνοιγμα του Stripe Onboarding
      if (onboardingUrl) {
        setStatusText('Ανοίγω τη σελίδα της Stripe...');
        await Linking.openURL(onboardingUrl);
      } else {
        Alert.alert('Επιτυχία!', 'Ο λογαριασμός Stripe δημιουργήθηκε.');
      }
    } catch (error) {
      console.error('❌ Σφάλμα Stripe onboarding:', error);
      Alert.alert('Σφάλμα Stripe', error.message || 'Δεν μπόρεσε να συνδεθεί.');
    } finally {
      setLoading(false);
      setStatusText('');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Σύνδεση Stripe</Text>

      <Text style={styles.description}>
        Η Stripe θα διαχειρίζεται τις πληρωμές και θα μεταφέρει τα χρήματα
        στον λογαριασμό σου μετά την ολοκλήρωση κράτησης.
      </Text>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Marketplace flow</Text>
        <Text style={styles.infoItem}>1. Ο οδηγός πληρώνει στην εφαρμογή</Text>
        <Text style={styles.infoItem}>2. Η Stripe κρατά τα χρήματα</Text>
        <Text style={styles.infoItem}>3. Η Stripe μεταφέρει το ποσό στον ιδιοκτήτη</Text>
        <Text style={styles.infoItem}>4. Η πλατφόρμα κρατά προμήθεια 10%</Text>
      </View>

      <Text style={styles.description}>
        Σύνδεση Stripe για λήψη πληρωμών από κλειστές κρατήσεις.
      </Text>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleConnectStripe}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Σύνδεση με Stripe</Text>
        )}
      </TouchableOpacity>

      {statusText ? <Text style={styles.status}>{statusText}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 20, paddingTop: 50 },
  header: { fontSize: 28, fontWeight: 'bold', color: COLORS.primary, textAlign: 'center', marginBottom: 20 },
  description: { fontSize: 16, color: COLORS.textLight, textAlign: 'center', marginBottom: 20, lineHeight: 22 },
  infoCard: { backgroundColor: COLORS.white, padding: 18, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: COLORS.border },
  infoTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 12 },
  infoItem: { fontSize: 15, color: COLORS.text, marginBottom: 6 },
  button: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: COLORS.white, fontWeight: 'bold', fontSize: 18 },
  status: { marginTop: 20, textAlign: 'center', color: COLORS.primary, fontSize: 15 },
});