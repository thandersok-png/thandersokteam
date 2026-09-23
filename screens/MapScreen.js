import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
  RefreshControl,
  ScrollView,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import NetInfo from '@react-native-community/netinfo';
import { collection, getDocs, addDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
const { createSpotCache, withCachedSnapshot } = require('../utils/spotCache');

const COLORS = {
  primary: '#1a73e8',
  secondary: '#4CAF50',
  background: '#f5f5f5',
  white: '#ffffff',
  text: '#333333',
  textLight: '#666666',
  border: '#e0e0e0',
  danger: '#c62828',
};

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
];

const getCityByName = (name) => CITIES.find((city) => city.name === name);
const spotCache = createSpotCache(10 * 60 * 1000);

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
  const [statusMessage, setStatusMessage] = useState('');
  const [offline, setOffline] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newSpotTitle, setNewSpotTitle] = useState('');
  const [newSpotPrice, setNewSpotPrice] = useState('');
  const [newSpotCode, setNewSpotCode] = useState('');
  const [selectedCoordinates, setSelectedCoordinates] = useState(null);
  const [addingSpot, setAddingSpot] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const isNetworkDown = !state.isConnected || state.isInternetReachable === false;
      setOffline(isNetworkDown);
      if (isNetworkDown) {
        setStatusMessage('Δεν υπάρχει σύνδεση στο διαδίκτυο. Προβολή σε offline mode.');
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Η άδεια τοποθεσίας απορρίφθηκε');
          setLoading(false);
          return;
        }

        const currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation);
      } catch (error) {
        setErrorMsg('Δεν μπόρεσε να βρει την τοποθεσία σας');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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

  const fetchSpots = async () => {
    setLoading(true);
    try {
      const readSpots = async () => {
        const q = query(collection(db, 'spots'), where('city', '==', selectedCity));
        const querySnapshot = await getDocs(q);
        const data = [];
        querySnapshot.forEach((doc) => {
          data.push({ id: doc.id, ...doc.data() });
        });
        return data;
      };

      const data = await withCachedSnapshot(selectedCity, readSpots, spotCache, 10 * 60 * 1000);
      setSpots(data);
    } catch (error) {
      console.error('❌ Σφάλμα φόρτωσης θέσεων:', error);
      setStatusMessage('Δεν μπόρεσε να φορτωθούν οι θέσεις.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSpots();
  }, [selectedCity]);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const q = query(
          collection(db, 'bookings'),
          where('date', '==', today),
          where('status', '==', 'confirmed')
        );
        const snapshot = await getDocs(q);
        const ids = [];
        snapshot.forEach((doc) => {
          ids.push(doc.data().spotId);
        });

        setBookedSpotIds(ids);
        console.log('🔒 Κλεισμένες θέσεις:', ids);
      } catch (error) {
        console.error('❌ Σφάλμα φόρτωσης κρατήσεων:', error);
      }
    };

    fetchBookings();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    setStatusMessage(offline ? 'Δεν υπάρχει σύνδεση στο διαδίκτυο.' : '');
    await fetchSpots();
  };

  const handleLongPress = (event) => {
    const { coordinate } = event.nativeEvent;
    setSelectedCoordinates(coordinate);
    setNewSpotTitle('');
    setNewSpotPrice('');
    setNewSpotCode('');
    setShowAddModal(true);
  };

  const checkSpotClosed = async (spotId) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const q = query(
        collection(db, 'bookings'),
        where('spotId', '==', spotId),
        where('date', '==', today),
        where('status', '==', 'confirmed')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.length > 0;
    } catch (error) {
      console.log('Σφάλμα ελέγχου κράτησης:', error);
      return false;
    }
  };

  const handleAddSpotFromMap = async () => {
    if (!newSpotTitle || !newSpotPrice || !newSpotCode || !selectedCoordinates) {
      setStatusMessage('Συμπληρώστε όλα τα πεδία και επιλέξτε σημείο στον χάρτη.');
      return;
    }

    setAddingSpot(true);

    try {
      const user = auth.currentUser;
      const newSpot = {
        title: newSpotTitle.trim(),
        spotCode: newSpotCode.toUpperCase().trim(),
        address: `Θέση στο map, ${selectedCity}`,
        price: parseFloat(newSpotPrice) || 0,
        available: '09:00 - 17:00',
        latitude: selectedCoordinates.latitude,
        longitude: selectedCoordinates.longitude,
        city: selectedCity,
        ownerId: user?.uid || 'demo_owner',
        active: true,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'spots'), newSpot);
      setSpots([...spots, { id: docRef.id, ...newSpot }]);
      setStatusMessage('Η θέση αποθηκεύτηκε.');

      setShowAddModal(false);
      setNewSpotTitle('');
      setNewSpotPrice('');
      setNewSpotCode('');
      setSelectedCoordinates(null);
    } catch (error) {
      console.log('Σφάλμα:', error?.message || error);
      setStatusMessage(error.message || 'Δεν μπόρεσε να αποθηκευτεί η θέση.');
    } finally {
      setAddingSpot(false);
    }
  };

  const handleMarkerPress = (spot) => setSelectedSpot(spot);
  const handleCloseCard = () => setSelectedSpot(null);

  const handleBooking = async (spot) => {
    const isClosed = bookedSpotIds.includes(spot.id) || (await checkSpotClosed(spot.id));
    if (isClosed) {
      setStatusMessage('Η θέση είναι κλεισμένη για σήμερα.');
      return;
    }

    navigation.navigate('Κράτηση', { spot });
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
        <Text style={styles.loadingText}>Φόρτωση...</Text>
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{errorMsg}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setErrorMsg(null);
            setLoading(true);
            (async () => {
              try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                  setErrorMsg('Η άδεια τοποθεσίας απορρίφθηκε');
                  setLoading(false);
                  return;
                }

                const currentLocation = await Location.getCurrentPositionAsync({});
                setLocation(currentLocation);
              } catch (error) {
                setErrorMsg('Δεν μπόρεσε να βρει την τοποθεσία σας');
              } finally {
                setLoading(false);
              }
            })();
          }}
        >
          <Text style={styles.retryButtonText}>🔄 Προσπάθησε ξανά</Text>
        </TouchableOpacity>
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
                    ? 'green'
                    : COLORS.primary
                }
              />
            );
          }
          return null;
        })}
      </MapView>

      {selectedSpot && (
        <View style={[styles.card, bookedSpotIds.includes(selectedSpot.id) && styles.cardClosed]}>
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

          <TouchableOpacity style={styles.bar} onPress={() => navigation.navigate('Reviews', { spot: selectedSpot })}>
            <Text style={styles.barLabel}>⭐ Αξιολόγηση</Text>
            <Text style={styles.barValue}>{selectedSpot.ratingCount ? `${'★'.repeat(Math.round(Number(selectedSpot.ratingAverage)))} ${Number(selectedSpot.ratingAverage).toFixed(1)} (${selectedSpot.ratingCount})` : 'Αξιολόγησε τη θέση'}</Text>
          </TouchableOpacity>

          <Text style={styles.addressText}>📍 {selectedSpot.address}</Text>

          <TouchableOpacity
            style={[
              styles.bookButton,
              bookedSpotIds.includes(selectedSpot.id) && styles.bookButtonDisabled,
            ]}
            onPress={() => handleBooking(selectedSpot)}
            disabled={bookedSpotIds.includes(selectedSpot.id)}
          >
            <Text style={styles.bookButtonText}>
              {bookedSpotIds.includes(selectedSpot.id) ? '🔴 Κλεισμένη' : '📅 Κράτηση'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {statusMessage ? <Text style={styles.statusMessage}>{statusMessage}</Text> : null}

      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
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

            <Text style={styles.label}>Κωδικός *</Text>
            <TextInput
              style={styles.input}
              placeholder="π.χ. A12"
              value={newSpotCode}
              onChangeText={setNewSpotCode}
              autoCapitalize="characters"
            />

            <Text style={styles.label}>Τιμή (€/ώρα) *</Text>
            <TextInput
              style={styles.input}
              placeholder="π.χ. 1.50"
              keyboardType="numeric"
              value={newSpotPrice}
              onChangeText={setNewSpotPrice}
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
        </View>
      </Modal>

      <Modal visible={showCityPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
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
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  map: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background, padding: 20 },
  loadingText: { marginTop: 10, fontSize: 16, color: COLORS.textLight },
  error: { fontSize: 16, color: 'red', textAlign: 'center', marginBottom: 20 },
  retryButton: { backgroundColor: COLORS.primary, padding: 12, borderRadius: 8 },
  retryButtonText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16 },
  citySelector: { position: 'absolute', top: 28, left: 20, zIndex: 10, backgroundColor: COLORS.white, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 5 },
  citySelectorText: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  citySelectorArrow: { fontSize: 14, color: COLORS.textLight, marginLeft: 8 },
  card: { position: 'absolute', top: 120, left: 20, right: 20, backgroundColor: COLORS.white, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
  cardClosed: { borderWidth: 2, borderColor: COLORS.danger },
  closeButton: { position: 'absolute', top: 10, right: 14, zIndex: 10 },
  closeText: { fontSize: 18, color: '#999', fontWeight: 'bold' },
  bookedBadge: { backgroundColor: '#ffebee', color: COLORS.danger, fontWeight: 'bold', textAlign: 'center', padding: 6, borderRadius: 8, marginBottom: 10 },
  bar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  barLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textLight },
  barValue: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  addressText: { fontSize: 13, color: COLORS.textLight, marginTop: 8, marginBottom: 10, fontStyle: 'italic' },
  bookButton: { backgroundColor: COLORS.primary, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  bookButtonDisabled: { backgroundColor: COLORS.danger },
  bookButtonText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16 },
  statusMessage: { position: 'absolute', top: 140, left: 20, right: 20, zIndex: 11, backgroundColor: '#fff', color: '#b71c1c', padding: 12, fontWeight: 'bold', borderRadius: 10, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: COLORS.white, borderRadius: 16, padding: 24, width: '90%', maxHeight: '80%' },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.primary, textAlign: 'center', marginBottom: 4 },
  modalSubtitle: { fontSize: 12, color: COLORS.textLight, textAlign: 'center', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginTop: 10, marginBottom: 4 },
  input: { backgroundColor: COLORS.white, borderRadius: 10, padding: 12, fontSize: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 4 },
  modalButtonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, gap: 10 },
  modalButton: { flex: 1, padding: 14, borderRadius: 10, alignItems: 'center' },
  modalCancelButton: { backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border },
  modalSaveButton: { backgroundColor: COLORS.primary },
  modalButtonText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16 },
  buttonDisabled: { backgroundColor: '#999' },
  modalCloseButton: { marginTop: 16, padding: 14, borderRadius: 10, backgroundColor: COLORS.background, alignItems: 'center' },
  modalCloseText: { fontSize: 16, fontWeight: 'bold', color: COLORS.textLight },
  cityOption: { padding: 14, borderRadius: 10, marginBottom: 8, backgroundColor: COLORS.background },
  cityOptionActive: { backgroundColor: COLORS.primary },
  cityOptionText: { fontSize: 16, color: COLORS.text, textAlign: 'center' },
  cityOptionTextActive: { color: COLORS.white },
});