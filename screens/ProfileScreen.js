import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Alert, Text, useLanguage } from '../i18n';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import COLORS from '../theme/colors';

export default function ProfileScreen() {
  const { language, setLanguage } = useLanguage();
  const user = auth.currentUser;

  const handleLanguageChange = async (nextLanguage) => {
    try {
      await setLanguage(nextLanguage);
    } catch (error) {
      console.error('Could not save the selected app language:', error);
      Alert.alert(
        language === 'en' ? 'Error' : 'Σφάλμα',
        language === 'en'
          ? 'Could not save the language preference.'
          : 'Δεν ήταν δυνατή η αποθήκευση της γλώσσας.'
      );
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Αποσύνδεση',
      'Είστε σίγουροι ότι θέλετε να αποσυνδεθείτε;',
      [
        { text: 'Ακύρωση', style: 'cancel' },
        {
          text: 'Αποσύνδεση',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
            } catch (error) {
              console.error('❌ Σφάλμα αποσύνδεσης:', error);
              Alert.alert('Σφάλμα', 'Δεν μπόρεσε να αποσυνδεθεί.');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>👤 Προφίλ</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{user?.email || 'Δεν υπάρχει'}</Text>

        <Text style={styles.label}>UID</Text>
        <Text style={styles.value}>{user?.uid || 'Δεν υπάρχει'}</Text>
      </View>

      <Text style={styles.languageLabel}>🌐 Γλώσσα εφαρμογής</Text>
      <View style={styles.languageOptions}>
        {[
          { code: 'el', label: 'Ελληνικά' },
          { code: 'en', label: 'English' },
        ].map((option) => (
          <TouchableOpacity
            key={option.code}
            style={[
              styles.languageButton,
              language === option.code && styles.languageButtonActive,
            ]}
            onPress={() => handleLanguageChange(option.code)}
            accessibilityRole="button"
            accessibilityState={{ selected: language === option.code }}
          >
            <Text
              style={[
                styles.languageButtonText,
                language === option.code && styles.languageButtonTextActive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>🚪 Αποσύνδεση</Text>
      </TouchableOpacity>

      {/* Copyright */}
      <View style={styles.footer}>
        <Text style={styles.copyrightText}>
          © 2026 ParkShare. All rights reserved.
        </Text>
        <Text style={styles.versionText}>Έκδοση 1.0.0</Text>
      </View>
    </View>
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
  card: {
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textLight,
    marginTop: 12,
  },
  value: {
    fontSize: 16,
    color: COLORS.text,
    marginTop: 4,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  logoutButton: {
    backgroundColor: COLORS.danger,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 30,
  },
  languageLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 22,
    marginBottom: 8,
  },
  languageOptions: { flexDirection: 'row', gap: 10 },
  languageButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  languageButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#eff4ff',
  },
  languageButtonText: { color: COLORS.text, fontWeight: '600' },
  languageButtonTextActive: { color: COLORS.primary },
  logoutButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 18,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  copyrightText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
  versionText: {
    fontSize: 10,
    color: '#aaa',
    marginTop: 4,
  },
});