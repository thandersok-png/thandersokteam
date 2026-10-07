import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import COLORS from '../theme/colors';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Σφάλμα', 'Συμπληρώστε email και κωδικό.');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // Η πλοήγηση γίνεται αυτόματα από το App.js (auth state listener)
    } catch (error) {
      console.error('❌ Σφάλμα σύνδεσης:', error);
      let message = 'Κάτι πήγε λάθος. Δοκιμάστε ξανά.';
      if (error.code === 'auth/invalid-email') {
        message = 'Το email δεν είναι έγκυρο.';
      } else if (error.code === 'auth/user-not-found') {
        message = 'Δεν υπάρχει λογαριασμός με αυτό το email.';
      } else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        message = 'Λάθος κωδικός. Δοκιμάστε ξανά.';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Πολλές προσπάθειες. Δοκιμάστε αργότερα.';
      }
      Alert.alert('Σφάλμα Σύνδεσης', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>🚗 ParkShare</Text>
        <Text style={styles.subtitle}>Συνδεθείτε για να συνεχίσετε</Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="email@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
        />

        <Text style={styles.label}>Κωδικός</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword((prev) => !prev)}
          >
            <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.loginButton, loading && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.loginButtonText}>Σύνδεση</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.registerLink}
          onPress={() => navigation.navigate('Εγγραφή')}
        >
          <Text style={styles.registerText}>
            Δεν έχετε λογαριασμό;{' '}
            <Text style={styles.registerTextBold}>Εγγραφή</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  logo: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: 32,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.text,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  passwordInput: {
    flex: 1,
    padding: 14,
    fontSize: 16,
    color: COLORS.text,
  },
  eyeButton: {
    paddingHorizontal: 14,
  },
  eyeText: {
    fontSize: 18,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 17,
  },
  registerLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  registerText: {
    fontSize: 15,
    color: COLORS.textLight,
  },
  registerTextBold: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
});