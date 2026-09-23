import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';

const COLORS = {
  primary: '#1a73e8',
  secondary: '#4CAF50',
  background: '#f5f5f5',
  white: '#ffffff',
  text: '#333333',
  textLight: '#666666',
  border: '#e0e0e0',
};

export default function MySpotsScreen({ navigation }) {
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMySpots = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const q = query(
          collection(db, 'spots'),
          where('ownerId', '==', user.uid)
        );
        const querySnapshot = await getDocs(q);
        const data = [];
        querySnapshot.forEach((doc) => {
          data.push({ id: doc.id, ...doc.data() });
        });
        setSpots(data);
      } catch (error) {
        console.error('❌ Σφάλμα φόρτωσης θέσεων:', error);
        Alert.alert('Σφάλμα', 'Δεν μπόρεσε να φορτώσει τις θέσεις σας.');
      } finally {
        setLoading(false);
      }
    };

    fetchMySpots();
  }, []);

  const SpotCard = ({ spot }) => (
    <View style={styles.card}>
      <Text style={styles.title}>{spot.title}</Text>
      <Text style={styles.spotCode}>🔑 {spot.spotCode || 'Δεν έχει κωδικό'}</Text>
      <Text style={styles.address}>{spot.address}</Text>
      <View style={styles.row}>
        <Text style={styles.price}>{spot.price} €/ώρα</Text>
        <Text style={styles.available}>{spot.available || '09:00 - 17:00'}</Text>
      </View>
      <TouchableOpacity style={styles.qrButton} onPress={() => navigation.navigate('QRCode', { spot })}>
        <Text style={styles.qrButtonText}>▣ Προβολή QR check-in</Text>
      </TouchableOpacity>
    </View>
  );

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
      <Text style={styles.header}>🏢 Οι Θέσεις μου</Text>
      <FlatList
        data={spots}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <SpotCard spot={item} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>Δεν έχετε προσθέσει ακόμα θέσεις</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 50,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.textLight,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  list: {
    paddingHorizontal: 15,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: COLORS.white,
    padding: 15,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  spotCode: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  address: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  available: {
    fontSize: 14,
    color: COLORS.primary,
  },
  qrButton: { backgroundColor: '#e8f0fe', padding: 12, borderRadius: 10, alignItems: 'center', marginTop: 14 },
  qrButtonText: { color: COLORS.primary, fontWeight: 'bold' },
  empty: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: COLORS.textLight,
  },
});