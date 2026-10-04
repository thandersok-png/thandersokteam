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
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import COLORS from '../theme/colors';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      Alert.alert('Σφάλμα', 'Συμπληρώστε email και κωδικό.');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, normalizedEmail, password);
    } catch (error) {
      console.error('❌ Σφάλμα σύνδεσης:', error);
      let message = 'Παρουσιάστηκε σφάλμα.';
      if (error.code === 'auth/user-not-found') {
        message = 'Δεν βρέθηκε χρήστης με αυτό το email.';
      } else if (error.code === 'auth/wrong-password') {
        message = 'Λάθος κωδικός.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Μη έγκυρο email.';
      } else if (error.code === 'auth/invalid-credential') {
        message = 'Λάθος email ή κωδικός.';
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
        <Text style={styles.title}>🚗 ParkShare</Text>
        <Text style={styles.subtitle}>Συνδεθείτε για να συνεχίσετε</Text>

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
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Σύνδεση</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.registerLink}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.registerText}>
            Δεν έχετε λογαριασμό;{' '}
            <Text style={styles.registerBold}>Εγγραφή</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  innerContainer: { flex: 1, justifyContent: 'center', padding: 30 },
  title: { fontSize: 40, fontWeight: 'bold', color: COLORS.primary, textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 16, color: COLORS.textLight, textAlign: 'center', marginBottom: 40 },
  label: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  input: { backgroundColor: COLORS.white, borderRadius: 10, padding: 14, fontSize: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 16 },
  button: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#999' },
  buttonText: { color: COLORS.white, fontWeight: 'bold', fontSize: 18 },
  registerLink: { marginTop: 20, alignItems: 'center' },
  registerText: { fontSize: 16, color: COLORS.textLight },
  registerBold: { color: COLORS.primary, fontWeight: 'bold' },
});