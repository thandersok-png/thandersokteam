import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Linking,
  RefreshControl,
} from 'react-native';
import { collection, getDocs, query, where } from 'firebase/firestore';
import NetInfo from '@react-native-community/netinfo';
import { db } from '../firebase';
import * as Location from 'expo-location';
import COLORS from '../theme/colors';
const { createSpotCache, withCachedSnapshot } = require('../utils/spotCache');

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

const spotCache = createSpotCache(10 * 60 * 1000);

export default function ListScreen({ navigation }) {
  const [spots, setSpots] = useState([]);
  const [filteredSpots, setFilteredSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState('Θεσσαλονίκη');
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortType, setSortType] = useState('none');
  const [filterAvailable, setFilterAvailable] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [bookedSpotIds, setBookedSpotIds] = useState([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [offline, setOffline] = useState(false);

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
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          setUserLocation(location);
        }
      } catch (error) {
        console.error('❌ Σφάλμα GPS:', error);
      }
    })();
  }, []);

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
      applyFiltersAndSort(data, searchQuery, sortType, filterAvailable, userLocation);
    } catch (error) {
      console.error('❌ Σφάλμα φόρτωσης:', error);
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

  const applyFiltersAndSort = (data, q, sort, available, location) => {
    let result = [...data];

    if (q.trim() !== '') {
      const lowerQ = q.toLowerCase();
      result = result.filter(
        (spot) =>
          spot.title?.toLowerCase().includes(lowerQ) ||
          spot.address?.toLowerCase().includes(lowerQ) ||
          spot.spotCode?.toLowerCase().includes(lowerQ)
      );
    }

    if (available) {
      const now = new Date();
      const currentHour = now.getHours();
      result = result.filter((spot) => {
        if (!spot.available) return true;

        const [start, end] = String(spot.available).split(' - ');
        if (!start || !end) return true;

        const startHour = parseInt(start.split(':')[0], 10);
        const endHour = parseInt(end.split(':')[0], 10);

        return currentHour >= startHour && currentHour < endHour;
      });
    }

    if (sort === 'price') {
      result.sort((a, b) => parseFloat(a.price || 0) - parseFloat(b.price || 0));
    } else if (sort === 'distance' && location) {
      result.sort((a, b) => {
        const distA = calculateDistance(location, a);
        const distB = calculateDistance(location, b);
        return distA - distB;
      });
    }

    setFilteredSpots(result);
  };

  const calculateDistance = (loc, spot) => {
    const lat1 = loc.coords?.latitude || 0;
    const lon1 = loc.coords?.longitude || 0;
    const lat2 = parseFloat(spot.latitude) || 0;
    const lon2 = parseFloat(spot.longitude) || 0;

    if (lat1 === 0 || lon1 === 0 || lat2 === 0 || lon2 === 0) return 999999;

    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const deg2rad = (deg) => deg * (Math.PI / 180);

  const handleSearch = (text) => {
    setSearchQuery(text);
    applyFiltersAndSort(spots, text, sortType, filterAvailable, userLocation);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setStatusMessage(offline ? 'Δεν υπάρχει σύνδεση στο διαδίκτυο.' : '');
    await fetchSpots();
  };

  const handleSort = (type) => {
    const newSort = sortType === type ? 'none' : type;
    setSortType(newSort);
    applyFiltersAndSort(spots, searchQuery, newSort, filterAvailable, userLocation);
  };

  const toggleAvailabilityFilter = () => {
    const newValue = !filterAvailable;
    setFilterAvailable(newValue);
    applyFiltersAndSort(spots, searchQuery, sortType, newValue, userLocation);
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

  const handleBooking = async (spot) => {
    const isClosed = bookedSpotIds.includes(spot.id) || (await checkSpotClosed(spot.id));
    if (isClosed) {
      setStatusMessage('Η θέση είναι κλεισμένη για σήμερα.');
      return;
    }

    navigation.navigate('Κράτηση', { spot });
  };

  const openNavigation = (spot) => {
    const lat = parseFloat(spot.latitude) || 40.635;
    const lng = parseFloat(spot.longitude) || 22.941;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

    Linking.openURL(url).catch(() => {
      setStatusMessage('Δεν μπόρεσε να ανοίξει η πλοήγηση.');
    });
  };

  const SpotCard = ({ spot }) => {
    const isBooked = bookedSpotIds.includes(spot.id);

    return (
      <View style={[styles.card, isBooked && styles.cardClosed]}>
        {isBooked && <Text style={styles.bookedBadge}>🔴 ΚΛΕΙΣΜΕΝΗ</Text>}

        <Text style={styles.title}>{spot.title}</Text>
        <TouchableOpacity style={styles.ratingRow} onPress={() => navigation.navigate('Reviews', { spot })}>
          <Text style={styles.ratingStars}>{'★'.repeat(Math.round(Number(spot.ratingAverage || 0)))}{'☆'.repeat(5 - Math.round(Number(spot.ratingAverage || 0)))}</Text>
          <Text style={styles.ratingText}>{spot.ratingCount ? `${Number(spot.ratingAverage).toFixed(1)} (${spot.ratingCount})` : 'Αξιολόγησε τη θέση'}</Text>
        </TouchableOpacity>
        <Text style={styles.spotCode}>🔑 {spot.spotCode || 'Δεν έχει κωδικό'}</Text>
        <Text style={styles.address}>{spot.address}</Text>

        <View style={styles.row}>
          <Text style={styles.price}>{spot.price} €/ώρα</Text>
          <Text style={styles.available}>{spot.available || '09:00 - 17:00'}</Text>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.navButton} onPress={() => openNavigation(spot)}>
            <Text style={styles.navButtonText}>🧭 Οδήγηση</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.bookButton, isBooked && styles.bookButtonDisabled]}
            onPress={() => handleBooking(spot)}
            disabled={isBooked}
          >
            <Text style={styles.bookButtonText}>
              {isBooked ? '🔴 Κλεισμένη' : '📅 Κράτηση'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
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
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.citySelector} onPress={() => setShowCityPicker(!showCityPicker)}>
          <Text style={styles.citySelectorText}>📍 {selectedCity}</Text>
          <Text style={styles.citySelectorArrow}>▼</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.searchInput}
          placeholder="Αναζήτηση..."
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      {showCityPicker && (
        <View style={styles.cityPickerPanel}>
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
        </View>
      )}

      <View style={styles.controlsRow}>
        <TouchableOpacity
          style={[styles.filterButton, sortType === 'price' && styles.filterButtonActive]}
          onPress={() => handleSort('price')}
        >
          <Text style={[styles.filterButtonText, sortType === 'price' && styles.filterButtonTextActive]}>Τιμή</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, sortType === 'distance' && styles.filterButtonActive]}
          onPress={() => handleSort('distance')}
        >
          <Text style={[styles.filterButtonText, sortType === 'distance' && styles.filterButtonTextActive]}>Απόσταση</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, filterAvailable && styles.filterButtonActive]}
          onPress={toggleAvailabilityFilter}
        >
          <Text style={[styles.filterButtonText, filterAvailable && styles.filterButtonTextActive]}>Διαθέσιμες</Text>
        </TouchableOpacity>
      </View>

      {statusMessage ? <Text style={styles.statusMessage}>{statusMessage}</Text> : null}

      <FlatList
        data={filteredSpots}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.emptyText}>Δεν βρέθηκαν θέσεις</Text>}
        renderItem={({ item }) => <SpotCard spot={item} />}
        refreshing={refreshing}
        onRefresh={onRefresh}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} tintColor={COLORS.primary} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  loadingText: { marginTop: 10, fontSize: 16, color: COLORS.textLight },

  topBar: {
    padding: 14,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
  },
  citySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  citySelectorText: { fontSize: 14, fontWeight: 'bold', color: COLORS.text },
  citySelectorArrow: { marginLeft: 6, color: COLORS.textLight },
  searchInput: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    marginLeft: 10,
    fontSize: 16,
  },

  cityPickerPanel: { backgroundColor: COLORS.white, borderBottomWidth: 1, borderColor: COLORS.border, padding: 12 },
  cityOption: { paddingVertical: 12, borderBottomWidth: 1, borderColor: '#eee' },
  cityOptionActive: { backgroundColor: COLORS.primary },
  cityOptionText: { fontSize: 16, color: COLORS.text, textAlign: 'center' },
  cityOptionTextActive: { color: COLORS.white },

  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: COLORS.white,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterButtonActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterButtonText: { fontWeight: 'bold', color: COLORS.text, fontSize: 13 },
  filterButtonTextActive: { color: COLORS.white },

  statusMessage: { color: '#b71c1c', backgroundColor: '#ffeaea', padding: 10, fontWeight: 'bold' },

  list: { flex: 1 },
  listContent: { padding: 12 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardClosed: { borderLeftColor: COLORS.danger, backgroundColor: '#fff3f3' },
  title: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  spotCode: { fontSize: 14, color: COLORS.textLight, marginTop: 4 },
  address: { fontSize: 14, color: COLORS.textLight, marginTop: 8 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  ratingStars: { color: '#f5b301', fontSize: 17, letterSpacing: 1 },
  ratingText: { color: COLORS.textLight, fontSize: 12, marginLeft: 7 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  price: { fontSize: 16, color: COLORS.secondary, fontWeight: 'bold' },
  available: { fontSize: 13, color: COLORS.textLight },
  bookedBadge: {
    backgroundColor: COLORS.danger,
    color: COLORS.white,
    fontWeight: 'bold',
    padding: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    overflow: 'hidden',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    gap: 10,
  },
  navButton: { flex: 1, backgroundColor: '#e8f0fe', padding: 12, borderRadius: 10, alignItems: 'center' },
  navButtonText: { color: COLORS.primary, fontWeight: 'bold' },
  bookButton: { flex: 1, backgroundColor: COLORS.primary, padding: 12, borderRadius: 10, alignItems: 'center' },
  bookButtonDisabled: { backgroundColor: '#b71c1c' },
  bookButtonText: { color: COLORS.white, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', color: COLORS.textLight, marginTop: 40 },
});
