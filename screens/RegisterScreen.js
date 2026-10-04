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
  ScrollView,
} from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import COLORS from '../theme/colors';

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('driver');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
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

    if (!privacyAccepted) {
      Alert.alert('Σφάλμα', 'Πρέπει να αποδεχτείτε την Πολιτική Απορρήτου.');
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        email: email.trim().toLowerCase(),
        role: role,
        uid: user.uid,
        privacyAccepted: true,
        privacyAcceptedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      });

      console.log('✅ Χρήστης δημιουργήθηκε:', user.uid, 'Ρόλος:', role);

      Alert.alert('Επιτυχία!', 'Ο λογαριασμός σας δημιουργήθηκε.');
      navigation.navigate('Login');
    } catch (error) {
      console.error('❌ Σφάλμα εγγραφής:', error);
      let message = error.message;
      if (error.code === 'auth/email-already-in-use') {
        message = 'Το email χρησιμοποιείται ήδη.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Μη έγκυρο email.';
      } else if (error.code === 'auth/weak-password') {
        message = 'Ο κωδικός είναι πολύ αδύναμος.';
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
      <ScrollView contentContainerStyle={styles.scrollContent}>
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

        <Text style={styles.label}>Επιλέξτε Ρόλο</Text>
        <View style={styles.roleContainer}>
          <TouchableOpacity
            style={[styles.roleButton, role === 'driver' && styles.roleActive]}
            onPress={() => setRole('driver')}
          >
            <Text style={[styles.roleText, role === 'driver' && styles.roleTextActive]}>
              🚗 Οδηγός
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roleButton, role === 'owner' && styles.roleActive]}
            onPress={() => setRole('owner')}
          >
            <Text style={[styles.roleText, role === 'owner' && styles.roleTextActive]}>
              🏢 Ιδιοκτήτης
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.consentRow} onPress={() => setPrivacyAccepted((current) => !current)} disabled={loading}>
          <View style={[styles.checkbox, privacyAccepted && styles.checkboxChecked]}>
            {privacyAccepted && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.consentText}>
            Αποδέχομαι την{' '}
            <Text style={styles.privacyLink} onPress={() => navigation.navigate('PrivacyPolicy')}>Πολιτική Απορρήτου</Text>
          </Text>
        </TouchableOpacity>

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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 30 },
  title: { fontSize: 36, fontWeight: 'bold', color: COLORS.primary, textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 16, color: COLORS.textLight, textAlign: 'center', marginBottom: 30 },
  label: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 6, marginTop: 10 },
  input: { backgroundColor: COLORS.white, borderRadius: 10, padding: 14, fontSize: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 8 },
  roleContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, gap: 10 },
  roleButton: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  roleActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  roleText: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  roleTextActive: { color: COLORS.white },
  button: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  buttonDisabled: { backgroundColor: '#999' },
  buttonText: { color: COLORS.white, fontWeight: 'bold', fontSize: 18 },
  loginLink: { marginTop: 20, alignItems: 'center' },
  loginText: { fontSize: 16, color: COLORS.textLight },
  loginBold: { color: COLORS.primary, fontWeight: 'bold' },
  consentRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  checkbox: { width: 24, height: 24, borderWidth: 2, borderColor: COLORS.border, borderRadius: 4, marginRight: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.white },
  checkboxChecked: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  checkmark: { color: COLORS.white, fontWeight: 'bold' },
  consentText: { flex: 1, color: COLORS.textLight, lineHeight: 20 },
  privacyLink: { color: COLORS.primary, fontWeight: 'bold' },
});