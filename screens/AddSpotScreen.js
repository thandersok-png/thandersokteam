import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
}
from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

const COLORS = {
  primary: '#1a73e8',
  secondary: '#4CAF50',
  background: '#f5f5f5',
  white: '#ffffff',
  text: '#333333',
  textLight: '#666666',
  border: '#e0e0e0',
};

const CITY_DEFAULT_COORDS = {
  'Θεσσαλονίκη': { latitude: 40.6401, longitude: 22.9444 },
  'Αθήνα': { latitude: 37.9838, longitude: 23.7275 },
  'Πάτρα': { latitude: 38.2466, longitude: 21.7346 },
  'Ηράκλειο': { latitude: 35.3387, longitude: 25.1442 },
  'Λάρισα': { latitude: 39.6390, longitude: 22.4191 },
  'Βόλος': { latitude: 39.3622, longitude: 22.9477 },
  'Ιωάννινα': { latitude: 39.6650, longitude: 20.8537 },
  'Χανιά': { latitude: 35.5138, longitude: 24.0180 },
  'Ρόδος': { latitude: 36.4351, longitude: 28.2082 },
};

export default function AddSpotScreen({ navigation }) {
  const [title, setTitle] = useState('');
  const [spotCode, setSpotCode] = useState('');
  const [address, setAddress] = useState('');
  const [price, setPrice] = useState('');
  const [city, setCity] = useState('Θεσσαλονίκη');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const clearForm = () => {
    setTitle('');
    setSpotCode('');
    setAddress('');
    setPrice('');
    setCity('Θεσσαλονίκη');
    setMessage('');
  };

  useFocusEffect(
    useCallback(() => {
      clearForm();
      return () => {};
    }, [])
  );

  const handleAddSpot = async () => {
    if (!title || !spotCode || !address || !price || !city) {
      setMessage('Συμπληρώστε όλα τα πεδία.');
      return;
    }

    setLoading(true);

    try {
      const user = auth.currentUser;
      const cityCoords = CITY_DEFAULT_COORDS[city.trim()] || CITY_DEFAULT_COORDS['Θεσσαλονίκη'];

      const newSpot = {
        title: title.trim(),
        spotCode: spotCode.toUpperCase().trim(),
        address: address.trim(),
        price: parseFloat(price) || 0,
        available: '09:00 - 17:00',
        latitude: cityCoords.latitude,
        longitude: cityCoords.longitude,
        city: city.trim(),
        ownerId: user?.uid || 'demo_owner',
        active: true,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'spots'), newSpot);
      setMessage('Η θέση αποθηκεύτηκε.');
      clearForm();
      navigation.navigate('Λίστα');
    } catch (error) {
      console.log('Σφάλμα:', error?.message || error);
      setMessage('Δεν μπόρεσε να αποθηκευτεί η θέση.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Νέα Θέση</Text>

      <Text style={styles.label}>Τίτλος *</Text>
      <TextInput
        style={styles.input}
        placeholder="π.χ. Πυλωτή Αριστοτέλους"
        value={title}
        onChangeText={setTitle}
      />

      <Text style={styles.label}>Κωδικός Θέσης *</Text>
      <TextInput
        style={styles.input}
        placeholder="π.χ. A12, B3, 105"
        value={spotCode}
        onChangeText={setSpotCode}
        autoCapitalize="characters"
      />

      <Text style={styles.label}>Διεύθυνση *</Text>
      <TextInput
        style={styles.input}
        placeholder="π.χ. Αριστοτέλους 12, Θεσσαλονίκη"
        value={address}
        onChangeText={setAddress}
      />

      <Text style={styles.label}>Τιμή (€/ώρα) *</Text>
      <TextInput
        style={styles.input}
        placeholder="π.χ. 1.50"
        keyboardType="numeric"
        value={price}
        onChangeText={setPrice}
      />

      <Text style={styles.label}>Πόλη *</Text>
      <TextInput
        style={styles.input}
        placeholder="π.χ. Θεσσαλονίκη"
        value={city}
        onChangeText={setCity}
      />

      {message ? <Text style={styles.message}>{message}</Text> : null}

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleAddSpot}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Αποθήκευση Θέσης</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 20,
    paddingTop: 50,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 12,
    marginBottom: 4,
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  message: {
    color: '#b71c1c',
    fontWeight: '600',
    marginTop: 12,
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  buttonDisabled: {
    backgroundColor: '#999',
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 18,
  },
});
