import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { collection, getDocs, addDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import COLORS from '../theme/colors';

// ✅ Η λίστα των πόλεων — ΜΟΝΟ ΕΔΩ, στην αρχή του αρχείου
const CITIES = [
  { id: 'athens', name: 'Αθήνα', lat: 37.9838, lng: 23.7275 },
  { id: 'thessaloniki', name: 'Θεσσαλονίκη', lat: 40.6401, lng: 22.9444 },
  { id: 'patra', name: 'Πάτρα', lat: 38.2466, lng: 21.7346 },
  { id: 'irakleio', name: 'Ηράκλειο', lat: 35.3387, lng: 25.1442 },
  { id: 'larisa', name: 'Λάρισα', lat: 39.6390, lng: 22.4191 },
  { id: 'volos', name: 'Βόλος', lat: 39.3622, lng: 22.9477 },
  { id: 'ioannina', name: 'Ιωάννινα', lat: 39.6650, lng: 20.8537 },
  { id: 'chania', name: 'Χανιά', lat: 35.5138, lng: 24.0180 },
  { id: 'rhodes', name: 'Ρόδος', lat: 36.4351, lng: 28.2082 },
  { id: 'alexandroupoli', name: 'Αλεξανδρούπολη', lat: 40.8457, lng: 25.8743 },
  { id: 'kavala', name: 'Καβάλα', lat: 40.9396, lng: 24.4069 },
  { id: 'serres', name: 'Σέρρες', lat: 41.0852, lng: 23.5497 },
  { id: 'kalamata', name: 'Καλαμάτα', lat: 37.0389, lng: 22.1142 },
  { id: 'trikala', name: 'Τρίκαλα', lat: 39.5551, lng: 21.7680 },
  { id: 'kerkyra', name: 'Κέρκυρα', lat: 39.6243, lng: 19.9217 },
  { id: 'zakynthos', name: 'Ζάκυνθος', lat: 37.7870, lng: 20.8990 },
];

const getCityByName = (name) => CITIES.find(city => city.name === name);

export default function MapScreen({ navigation }) {
  const [location, setLocation] = useState(null);
  const [spots, setSpots] = useState([]);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState('Θεσσαλονίκη');
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [mapRegion, setMapRegion] = useState(null);
  const [bookedSpotIds, setBookedSpotIds] = useState([]);

  // Modal προσθήκης θέσης
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSpotTitle, setNewSpotTitle] = useState('');
  const [newSpotCode, setNewSpotCode] = useState('');
  const [newSpotAddress, setNewSpotAddress] = useState('');
  const [newSpotPrice, setNewSpotPrice] = useState('');
  const [newSpotAvailable, setNewSpotAvailable] = useState('');
  const [newSpotCity, setNewSpotCity] = useState('Θεσσαλονίκη');
  const [selectedCoordinates, setSelectedCoordinates] = useState(null);
  const [addingSpot, setAddingSpot] = useState(false);

  // Φόρτωση τοποθεσίας
  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Η άδεια τοποθεσίας απορρίφθηκε');
          setLoading(false);
          return;
        }
        let currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation);
      } catch (error) {
        setErrorMsg('Δεν μπόρεσε να βρει την τοποθεσία σας');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Ενημέρωση χάρτη όταν αλλάζει πόλη
  useEffect(() => {
    const cityCoords = getCityByName(selectedCity);
    if (cityCoords) {
      setMapRegion({
        latitude: cityCoords.lat,
        longitude: cityCoords.lng,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    }
  }, [selectedCity]);

  // Φόρτωση θέσεων
  useEffect(() => {
    const fetchSpots = async () => {
      try {
        const q = query(collection(db, 'spots'), where('city', '==', selectedCity));
        const querySnapshot = await getDocs(q);
        const data = [];
        querySnapshot.forEach((doc) => {
          data.push({ ...doc.data(), id: doc.id });
        });
        setSpots(data);
      } catch (error) {
        console.error('❌ Σφάλμα φόρτωσης θέσεων:', error);
      }
    };
    fetchSpots();
  }, [selectedCity]);

  // Φόρτωση κλεισμένων θέσεων
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const q = query(
          collection(db, 'bookings'),
          where('date', '==', today),
          where('status', '==', 'paid')
        );
        const snapshot = await getDocs(q);
        const ids = [];
        snapshot.forEach((doc) => {
          ids.push(doc.data().spotId);
        });
        setBookedSpotIds(ids);
      } catch (error) {
        console.error('❌ Σφάλμα φόρτωσης κρατήσεων:', error);
      }
    };
    fetchBookings();
  }, []);

  const handleLongPress = (event) => {
    const { coordinate } = event.nativeEvent;
    setSelectedCoordinates(coordinate);
    setNewSpotTitle('');
    setNewSpotCode('');
    setNewSpotAddress('');
    setNewSpotPrice('');
    setNewSpotAvailable('');
    setNewSpotCity(selectedCity);
    setShowAddModal(true);
  };

  const handleAddSpotFromMap = async () => {
    if (!newSpotTitle || !newSpotCode || !newSpotPrice) {
      Alert.alert('Σφάλμα', 'Συμπληρώστε τίτλο, κωδικό και τιμή.');
      return;
    }

    setAddingSpot(true);

    try {
      const user = auth.currentUser;
      const newSpot = {
        title: newSpotTitle.trim(),
        spotCode: newSpotCode.toUpperCase().trim(),
        address: newSpotAddress.trim() || `Θέση στον χάρτη, ${selectedCity}`,
        price: parseFloat(newSpotPrice) || 0,
        available: newSpotAvailable || '09:00 - 17:00',
        latitude: selectedCoordinates.latitude,
        longitude: selectedCoordinates.longitude,
        city: newSpotCity || selectedCity,
        ownerId: user?.uid || 'demo_owner',
        active: true,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'spots'), newSpot);
      setSpots([...spots, { id: docRef.id, ...newSpot }]);

      Alert.alert('Επιτυχία!', `Η θέση "${newSpotTitle}" προστέθηκε!`);
      setShowAddModal(false);
      setNewSpotTitle('');
      setNewSpotCode('');
      setNewSpotAddress('');
      setNewSpotPrice('');
      setNewSpotAvailable('');
      setNewSpotCity(selectedCity);
      setSelectedCoordinates(null);
    } catch (error) {
      Alert.alert('Σφάλμα', error.message || 'Δεν μπόρεσε να αποθηκευτεί η θέση.');
    } finally {
      setAddingSpot(false);
    }
  };

  const handleMarkerPress = (spot) => setSelectedSpot(spot);
  const handleCloseCard = () => setSelectedSpot(null);
  const handleBooking = (spot) => {
    if (bookedSpotIds.includes(spot.id)) {
      Alert.alert('🔴 Κλεισμένη Θέση', 'Αυτή η θέση είναι ήδη κλεισμένη για σήμερα.');
      return;
    }
    navigation.navigate('Κράτηση', { spot, spotId: spot.id });
  };

  const defaultRegion = {
    latitude: 40.6401,
    longitude: 22.9444,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.citySelector} onPress={() => setShowCityPicker(true)}>
        <Text style={styles.citySelectorText}>📍 {selectedCity}</Text>
        <Text style={styles.citySelectorArrow}>▼</Text>
      </TouchableOpacity>

      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={mapRegion || defaultRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
        onPress={handleCloseCard}
        onLongPress={handleLongPress}
      >
        {spots.map((spot) => {
          const lat = parseFloat(spot.latitude);
          const lng = parseFloat(spot.longitude);
          if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
            return (
              <Marker
                key={spot.id}
                coordinate={{ latitude: lat, longitude: lng }}
                title={spot.title}
                description={`${spot.price} €/ώρα`}
                onPress={() => handleMarkerPress(spot)}
                pinColor={
                  bookedSpotIds.includes(spot.id)
                    ? 'red'
                    : selectedSpot?.id === spot.id
                    ? COLORS.secondary
                    : COLORS.primary
                }
              />
            );
          }
          return null;
        })}
      </MapView>

      {selectedSpot && (
        <View style={styles.card}>
          <TouchableOpacity style={styles.closeButton} onPress={handleCloseCard}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>

          {bookedSpotIds.includes(selectedSpot.id) && (
            <Text style={styles.bookedBadge}>🔴 ΚΛΕΙΣΜΕΝΗ</Text>
          )}

          <View style={styles.bar}>
            <Text style={styles.barLabel}>🏷️ Τίτλος</Text>
            <Text style={styles.barValue}>{selectedSpot.title}</Text>
          </View>

          <View style={styles.bar}>
            <Text style={styles.barLabel}>🔑 Κωδικός</Text>
            <Text style={styles.barValue}>{selectedSpot.spotCode || 'Δεν έχει'}</Text>
          </View>

          <View style={styles.bar}>
            <Text style={styles.barLabel}>💰 Τιμή</Text>
            <Text style={styles.barValue}>{selectedSpot.price} €/ώρα</Text>
          </View>

          <View style={styles.bar}>
            <Text style={styles.barLabel}>🕐 Ώρες</Text>
            <Text style={styles.barValue}>{selectedSpot.available || '09:00 - 17:00'}</Text>
          </View>

          <Text style={styles.addressText}>📍 {selectedSpot.address}</Text>

          <TouchableOpacity
            style={[
              styles.bookButton,
              bookedSpotIds.includes(selectedSpot.id) && styles.bookButtonDisabled,
            ]}
            onPress={() => handleBooking(selectedSpot)}
            disabled={bookedSpotIds.includes(selectedSpot.id)}
          >
            <View style={styles.bookButtonContent}>
              <Ionicons
                name={bookedSpotIds.includes(selectedSpot.id) ? 'close-circle-outline' : 'calendar-outline'}
                size={18}
                color={COLORS.white}
              />
              <Text style={styles.bookButtonText}>
                {bookedSpotIds.includes(selectedSpot.id) ? 'Κλεισμένη' : 'Κράτηση'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Modal Προσθήκης Θέσης */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>📍 Νέα Θέση</Text>
              <Text style={styles.modalSubtitle}>
                Συντεταγμένες: {selectedCoordinates?.latitude?.toFixed(4)}, {selectedCoordinates?.longitude?.toFixed(4)}
              </Text>

              <Text style={styles.label}>Τίτλος *</Text>
              <TextInput
                style={styles.input}
                placeholder="π.χ. Πυλωτή Αριστοτέλους"
                value={newSpotTitle}
                onChangeText={setNewSpotTitle}
              />

              <Text style={styles.label}>Κωδικός Θέσης *</Text>
              <TextInput
                style={styles.input}
                placeholder="π.χ. A12, B3, 105"
                value={newSpotCode}
                onChangeText={setNewSpotCode}
                autoCapitalize="characters"
              />

              <Text style={styles.label}>Διεύθυνση *</Text>
              <TextInput
                style={styles.input}
                placeholder="π.χ. Αριστοτέλους 12, Θεσσαλονίκη"
                value={newSpotAddress}
                onChangeText={setNewSpotAddress}
              />

              <Text style={styles.label}>Τιμή (€/ώρα) *</Text>
              <TextInput
                style={styles.input}
                placeholder="π.χ. 1.50"
                keyboardType="numeric"
                value={newSpotPrice}
                onChangeText={setNewSpotPrice}
              />

              <Text style={styles.label}>Ώρες διαθεσιμότητας</Text>
              <TextInput
                style={styles.input}
                placeholder="π.χ. 10:00 - 18:00"
                value={newSpotAvailable}
                onChangeText={setNewSpotAvailable}
              />

              <Text style={styles.label}>Πόλη *</Text>
              <TextInput
                style={styles.input}
                placeholder="π.χ. Θεσσαλονίκη"
                value={newSpotCity}
                onChangeText={setNewSpotCity}
              />

              <View style={styles.modalButtonRow}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalCancelButton]}
                  onPress={() => setShowAddModal(false)}
                >
                  <Text style={styles.modalButtonText}>Ακύρωση</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.modalSaveButton, addingSpot && styles.buttonDisabled]}
                  onPress={handleAddSpotFromMap}
                  disabled={addingSpot}
                >
                  <Text style={styles.modalButtonText}>
                    {addingSpot ? 'Αποθήκευση...' : '💾 Αποθήκευση'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Modal Επιλογής Πόλης */}
      <Modal visible={showCityPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Επέλεξε Πόλη</Text>
              {CITIES.map((city) => (
                <TouchableOpacity
                  key={city.id}
                  style={[styles.cityOption, selectedCity === city.name && styles.cityOptionActive]}
                  onPress={() => {
                    setSelectedCity(city.name);
                    setShowCityPicker(false);
                  }}
                >
                  <Text style={[styles.cityOptionText, selectedCity === city.name && styles.cityOptionTextActive]}>
                    {city.name}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowCityPicker(false)}>
                <Text style={styles.modalCloseText}>Κλείσιμο</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  map: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background, padding: 20 },
  citySelector: { position: 'absolute', top: 20, left: 20, zIndex: 10, backgroundColor: COLORS.white, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, flexDirection: 'row', alignItems: 'center', elevation: 5 },
  citySelectorText: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  citySelectorArrow: { fontSize: 14, color: COLORS.textLight, marginLeft: 8 },
  card: { position: 'absolute', bottom: 100, left: 20, right: 20, backgroundColor: COLORS.surface, borderRadius: 18, padding: 18, elevation: 6, shadowColor: '#101828', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  closeButton: { position: 'absolute', top: 10, right: 14, zIndex: 10 },
  closeText: { fontSize: 18, color: '#999', fontWeight: 'bold' },
  bookedBadge: { backgroundColor: '#ffebee', color: '#c62828', fontWeight: 'bold', textAlign: 'center', padding: 6, borderRadius: 8, marginBottom: 10 },
  bar: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  barLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textLight },
  barValue: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  addressText: { fontSize: 13, color: COLORS.textLight, marginTop: 8, marginBottom: 10, fontStyle: 'italic' },
  bookButton: { backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  bookButtonContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  bookButtonDisabled: { backgroundColor: '#ccc' },
  bookButtonText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center' },
  modalScroll: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: COLORS.white, borderRadius: 16, padding: 24, width: '100%' },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.primary, textAlign: 'center', marginBottom: 4 },
  modalSubtitle: { fontSize: 12, color: COLORS.textLight, textAlign: 'center', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginTop: 10, marginBottom: 4 },
  input: { backgroundColor: COLORS.white, borderRadius: 10, padding: 12, fontSize: 16, borderWidth: 1, borderColor: COLORS.border },
  modalButtonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, gap: 10 },
  modalButton: { flex: 1, padding: 14, borderRadius: 10, alignItems: 'center' },
  modalCancelButton: { backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border },
  modalSaveButton: { backgroundColor: COLORS.primary },
  modalButtonText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16 },
  buttonDisabled: { opacity: 0.6 },
  modalCloseButton: { marginTop: 16, padding: 14, borderRadius: 10, backgroundColor: COLORS.background, alignItems: 'center' },
  modalCloseText: { fontSize: 16, fontWeight: 'bold', color: COLORS.textLight },
  cityOption: { padding: 14, borderRadius: 10, marginBottom: 8, backgroundColor: COLORS.background },
  cityOptionActive: { backgroundColor: COLORS.primary },
  cityOptionText: { fontSize: 16, color: COLORS.text, textAlign: 'center' },
  cityOptionTextActive: { color: COLORS.white },
});