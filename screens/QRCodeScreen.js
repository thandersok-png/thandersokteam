import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import COLORS from '../theme/colors';

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
  container: { flex: 1, alignItems: 'center', backgroundColor: COLORS.background, padding: 24, paddingTop: 50 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.primary, marginBottom: 8 },
  subtitle: { color: '#666', textAlign: 'center', marginBottom: 28, lineHeight: 21 },
  codeCard: { padding: 22, backgroundColor: COLORS.surface, borderRadius: 16, elevation: 4, shadowColor: '#101828', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  spotTitle: { fontSize: 21, fontWeight: 'bold', color: '#333', marginTop: 24 },
  spotCode: { color: COLORS.primary, fontWeight: '600', marginTop: 6 },
  note: { color: '#666', marginTop: 18, textAlign: 'center' },
  error: { color: '#b71c1c', fontWeight: 'bold' },
});
