import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { auth, db, createUserWithEmailAndPassword } from './firebase';
import { doc, setDoc } from 'firebase/firestore';

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('driver');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Σφάλμα', 'Συμπληρώστε όλα τα πεδία.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Σφάλμα', 'Οι κωδικοί δεν ταιριάζουν.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Σφάλμα', 'Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες.');
      return;
    }

    if (!['driver', 'owner'].includes(role)) {
      Alert.alert('Σφάλμα', 'Επιλέξτε ρόλο.');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: email.trim().toLowerCase(),
        role,
        uid: userCredential.user.uid,
      });
      Alert.alert('Επιτυχία!', 'Ο λογαριασμός σας δημιουργήθηκε.');
      navigation.navigate('Login');
    } catch (error) {
      console.error('❌ Σφάλμα εγγραφής:', error);
      let message = 'Παρουσιάστηκε σφάλμα.';
      if (error.code === 'auth/email-already-in-use') {
        message = 'Το email χρησιμοποιείται ήδη.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Μη έγκυρο email.';
      }
      Alert.alert('Σφάλμα', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.innerContainer}>
        <Text style={styles.title}>📝 Εγγραφή</Text>
        <Text style={styles.subtitle}>Δημιουργήστε νέο λογαριασμό</Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="email@example.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Κωδικός</Text>
        <TextInput
          style={styles.input}
          placeholder="•••••••• (τουλάχιστον 6 χαρακτήρες)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Text style={styles.label}>Επιβεβαίωση Κωδικού</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        <Text style={styles.label}>Ρόλος</Text>
        <View style={styles.roleContainer}>
          {[
            { value: 'driver', label: 'Οδηγός' },
            { value: 'owner', label: 'Ιδιοκτήτης θέσης' },
          ].map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[styles.roleButton, role === option.value && styles.roleButtonSelected]}
              onPress={() => setRole(option.value)}
              disabled={loading}
            >
              <Text style={[styles.roleText, role === option.value && styles.roleTextSelected]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Εγγραφή</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.loginLink}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginText}>
            Έχετε ήδη λογαριασμό;{' '}
            <Text style={styles.loginBold}>Σύνδεση</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 30,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1a73e8',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 16,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  roleButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: 'white',
    alignItems: 'center',
  },
  roleButtonSelected: {
    borderColor: '#1a73e8',
    backgroundColor: '#e8f0fe',
  },
  roleText: {
    color: '#333',
    fontWeight: '600',
    textAlign: 'center',
  },
  roleTextSelected: {
    color: '#1a73e8',
  },
  button: {
    backgroundColor: '#1a73e8',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#999',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  loginLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  loginText: {
    fontSize: 16,
    color: '#666',
  },
  loginBold: {
    color: '#1a73e8',
    fontWeight: 'bold',
  },
});