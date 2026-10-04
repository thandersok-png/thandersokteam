import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { collection, getDocs, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { auth, db } from '../firebase';
import COLORS from '../theme/colors';

export default function QRScannerScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);

  const handleBarcodeScanned = async ({ data }) => {
    if (scanned || checkingIn) return;
    setScanned(true);
    setCheckingIn(true);

    try {
      const payload = JSON.parse(data);
      if (payload.type !== 'parkshare-checkin' || !payload.spotId) {
        throw new Error('Μη έγκυρος κωδικός ParkShare.');
      }

      const user = auth.currentUser;
      if (!user) throw new Error('Πρέπει να συνδεθείτε για check-in.');

      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('spotId', '==', payload.spotId),
        where('userId', '==', user.uid),
        where('status', '==', 'confirmed')
      );
      const snapshot = await getDocs(bookingsQuery);
      const booking = snapshot.docs.find((item) => item.data().checkInStatus !== 'checked-in');

      if (!booking) {
        throw new Error('Δεν βρέθηκε ενεργή κράτηση για αυτή τη θέση.');
      }

      await updateDoc(booking.ref, {
        checkInStatus: 'checked-in',
        checkedInAt: serverTimestamp(),
      });
      Alert.alert('Επιτυχία', 'Η άφιξή σας επιβεβαιώθηκε.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Αποτυχία check-in', error.message || 'Δεν ήταν δυνατή η επιβεβαίωση.', [
        { text: 'Δοκιμή ξανά', onPress: () => setScanned(false) },
      ]);
    } finally {
      setCheckingIn(false);
    }
  };

  if (!permission) return <View style={styles.center}><ActivityIndicator color={COLORS.primary} /></View>;
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Χρειάζεται πρόσβαση στην κάμερα</Text>
        <Text style={styles.message}>Χρησιμοποιείται μόνο για τη σάρωση του QR check-in.</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Παραχώρηση πρόσβασης</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
      />
      <View style={styles.overlay}>
        <View style={styles.scanFrame} />
        <Text style={styles.instruction}>{checkingIn ? 'Επιβεβαίωση άφιξης...' : 'Στοχεύστε στο QR της θέσης'}</Text>
        {scanned && !checkingIn && (
          <TouchableOpacity style={styles.button} onPress={() => setScanned(false)}>
            <Text style={styles.buttonText}>Σάρωση ξανά</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', padding: 24 },
  scanFrame: { width: 250, height: 250, borderWidth: 3, borderColor: COLORS.secondary, borderRadius: 16 },
  instruction: { color: 'white', fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginTop: 24, backgroundColor: '#0009', padding: 10, borderRadius: 8 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: COLORS.background },
  title: { color: '#333', fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
  message: { color: '#666', textAlign: 'center', marginVertical: 16 },
  button: { backgroundColor: COLORS.primary, paddingVertical: 14, paddingHorizontal: 22, borderRadius: 12, marginTop: 18 },
  buttonText: { color: 'white', fontWeight: 'bold' },
});
