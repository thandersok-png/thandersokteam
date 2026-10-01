import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { db, auth } from '../firebase';

const COLORS = {
  primary: '#1a73e8',
  secondary: '#4CAF50',
  background: '#f5f5f5',
  white: '#ffffff',
  text: '#333333',
  textLight: '#666666',
  border: '#e0e0e0',
  danger: '#e53935',
};

export default function MySpotsScreen({ navigation }) {
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [newHours, setNewHours] = useState('');

  // Φόρτωση θέσεων
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
      querySnapshot.forEach((docSnap) => {
        data.push({ id: docSnap.id, ...docSnap.data() });
      });
      setSpots(data);
    } catch (error) {
      console.error('❌ Σφάλμα φόρτωσης θέσεων:', error);
      Alert.alert('Σφάλμα', 'Δεν μπόρεσε να φορτώσει τις θέσεις σας.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMySpots();
  }, []);

  // Διαγραφή θέσης
  const handleDelete = (spot) => {
    Alert.alert(
      '🗑️ Διαγραφή Θέσης',
      `Είσαι σίγουρος ότι θέλεις να διαγράψεις τη θέση "${spot.title}";\n\nΑυτή η ενέργεια δεν μπορεί να αναιρεθεί.`,
      [
        { text: 'Ακύρωση', style: 'cancel' },
        {
          text: 'Διαγραφή',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'spots', spot.id));
              setSpots((prev) => prev.filter((s) => s.id !== spot.id));
              Alert.alert('✅ Επιτυχία', 'Η θέση διαγράφηκε.');
            } catch (error) {
              console.error('❌ Σφάλμα διαγραφής:', error);
              Alert.alert('Σφάλμα', 'Δεν μπόρεσε να διαγραφεί η θέση.');
            }
          },
        },
      ]
    );
  };

  // Άνοιγμα modal επεξεργασίας
  const handleEditHours = (spot) => {
    setSelectedSpot(spot);
    setNewHours(spot.available || '09:00 - 17:00');
    setEditModalVisible(true);
  };

  // Αποθήκευση νέας ώρας
  const handleSaveHours = async () => {
    if (!newHours.trim()) {
      Alert.alert('Σφάλμα', 'Γράψε τις ώρες διαθεσιμότητας.');
      return;
    }

    try {
      await updateDoc(doc(db, 'spots', selectedSpot.id), {
        available: newHours.trim(),
      });

      setSpots((prev) =>
        prev.map((s) =>
          s.id === selectedSpot.id ? { ...s, available: newHours.trim() } : s
        )
      );

      setEditModalVisible(false);
      setSelectedSpot(null);
      setNewHours('');
      Alert.alert('✅ Επιτυχία', 'Η ώρα διαθεσιμότητας ενημερώθηκε.');
    } catch (error) {
      console.error('❌ Σφάλμα ενημέρωσης:', error);
      Alert.alert('Σφάλμα', 'Δεν μπόρεσε να ενημερωθεί η ώρα.');
    }
  };

  const SpotCard = ({ spot }) => (
    <View style={styles.card}>
      <Text style={styles.title}>{spot.title}</Text>
      <Text style={styles.spotCode}>🔑 {spot.spotCode || 'Δεν έχει κωδικό'}</Text>
      <Text style={styles.address}>{spot.address}</Text>
      <View style={styles.row}>
        <Text style={styles.price}>{spot.price} €/ώρα</Text>
        <Text style={styles.available}>{spot.available || '09:00 - 17:00'}</Text>
      </View>

      {/* Κουμπί QR */}
      <TouchableOpacity
        style={styles.qrButton}
        onPress={() => navigation.navigate('QRCode', { spot })}
      >
        <Text style={styles.qrButtonText}>▣ Προβολή QR check-in</Text>
      </TouchableOpacity>

      {/* Νέα κουμπιά: Επεξεργασία + Διαγραφή */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => handleEditHours(spot)}
        >
          <Text style={styles.editButtonText}>✏️ Αλλαγή Ώρας</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(spot)}
        >
          <Text style={styles.deleteButtonText}>🗑️ Διαγραφή</Text>
        </TouchableOpacity>
      </View>
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
        ListEmptyComponent={
          <Text style={styles.empty}>Δεν έχετε προσθέσει ακόμα θέσεις</Text>
        }
      />

      {/* Modal Επεξεργασίας Ώρας */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>✏️ Αλλαγή Ώρας Διαθεσιμότητας</Text>
            <Text style={styles.modalSubtitle}>
              {selectedSpot?.title}
            </Text>

            <Text style={styles.inputLabel}>Ώρες (π.χ. 09:00 - 17:00)</Text>
            <TextInput
              style={styles.input}
              value={newHours}
              onChangeText={setNewHours}
              placeholder="09:00 - 17:00"
              placeholderTextColor="#999"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Ακύρωση</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveHours}
              >
                <Text style={styles.saveButtonText}>💾 Αποθήκευση</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  qrButton: {
    backgroundColor: '#e8f0fe',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 14,
  },
  qrButtonText: { color: COLORS.primary, fontWeight: 'bold' },

  // Νέα styles για τα κουμπιά Επεξεργασίας & Διαγραφής
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 8,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#fff3e0',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#ef6c00',
    fontWeight: 'bold',
    fontSize: 13,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#ffebee',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: COLORS.danger,
    fontWeight: 'bold',
    fontSize: 13,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: COLORS.background,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 10,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: COLORS.text,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
  },
  saveButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  empty: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: COLORS.textLight,
  },
});