import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

export default function QRCodeScreen({ route }) {
  const { spot } = route.params || {};
  const value = JSON.stringify({
    type: 'parkshare-checkin',
    spotId: spot?.id,
    spotCode: spot?.spotCode || null,
  });

  if (!spot?.id) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Δεν βρέθηκε η θέση.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>QR Check-in</Text>
      <Text style={styles.subtitle}>Ο οδηγός σκανάρει αυτόν τον κωδικό κατά την άφιξη.</Text>
      <View style={styles.codeCard}>
        <QRCode value={value} size={250} backgroundColor="white" color="black" />
      </View>
      <Text style={styles.spotTitle}>{spot.title}</Text>
      <Text style={styles.spotCode}>Κωδικός: {spot.spotCode || 'Δεν έχει'}</Text>
      <Text style={styles.note}>Ο κωδικός είναι μοναδικός για τη συγκεκριμένη θέση.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', backgroundColor: '#f5f5f5', padding: 24, paddingTop: 50 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1a73e8', marginBottom: 8 },
  subtitle: { color: '#666', textAlign: 'center', marginBottom: 28, lineHeight: 21 },
  codeCard: { padding: 22, backgroundColor: 'white', borderRadius: 16, elevation: 4, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
  spotTitle: { fontSize: 21, fontWeight: 'bold', color: '#333', marginTop: 24 },
  spotCode: { color: '#1a73e8', fontWeight: '600', marginTop: 6 },
  note: { color: '#666', marginTop: 18, textAlign: 'center' },
  error: { color: '#b71c1c', fontWeight: 'bold' },
});
