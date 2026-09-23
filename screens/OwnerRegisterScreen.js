import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export default function OwnerRegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !phone) {
      Alert.alert('Σφάλμα', 'Συμπληρώστε όλα τα πεδία.');
      return;
    }

    setLoading(true);
    try {
      // Αποθήκευση στη συλλογή owners
      await addDoc(collection(db, 'owners'), {
        name,
        email,
        phone,
        subscriptionActive: false,
        subscriptionExpiry: null,
        createdAt: serverTimestamp(),
      });

      Alert.alert('Επιτυχία!', 'Ο λογαριασμός σας δημιουργήθηκε.');
      navigation.navigate('Login');
    } catch (error) {
      Alert.alert('Σφάλμα', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏢 Εγγραφή Ιδιοκτήτη</Text>
      <TextInput style={styles.input} placeholder="Ονοματεπώνυμο" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Τηλέφωνο" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Φόρτωση...' : 'Εγγραφή'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Έχετε ήδη λογαριασμό; Σύνδεση</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 30, backgroundColor: '#f5f5f5' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1a73e8', textAlign: 'center', marginBottom: 30 },
  input: { backgroundColor: 'white', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#ddd', marginBottom: 16 },
  button: { backgroundColor: '#1a73e8', padding: 16, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  link: { marginTop: 20, textAlign: 'center', color: '#1a73e8', fontWeight: 'bold' },
});