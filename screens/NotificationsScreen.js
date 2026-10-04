import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
} from 'react-native';
import {
  registerForPushNotifications,
  sendLocalNotification,
} from '../utils/notifications';
import COLORS from '../theme/colors';

export default function NotificationsScreen() {
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushToken, setPushToken] = useState(null);

  useEffect(() => {
    checkPushPermission();
  }, []);

  const checkPushPermission = async () => {
    try {
      console.log('🔍 Έλεγχος push permission...');
      const token = await registerForPushNotifications();
      console.log('📱 Token:', token);

      if (token) {
        setPushToken(token);
        setPushEnabled(true);
      }
    } catch (error) {
      console.error('❌ Σφάλμα checkPushPermission:', error);
    }
  };

  const togglePush = async (value) => {
    try {
      console.log('🔔 Switch:', value);

      if (value) {
        const token = await registerForPushNotifications();
        console.log('📱 Token:', token);

        if (token) {
          setPushToken(token);
          setPushEnabled(true);
          Alert.alert('✅ Ενεργοποιήθηκαν', 'Θα λαμβάνετε ειδοποιήσεις.');
        } else {
          Alert.alert(
            '⚠️ Σφάλμα',
            'Δεν μπόρεσε να ενεργοποιηθεί. Ελέγξτε το τερματικό για logs.'
          );
        }
      } else {
        setPushEnabled(false);
        Alert.alert('❌ Απενεργοποιήθηκαν', 'Δεν θα λαμβάνετε ειδοποιήσεις.');
      }
    } catch (error) {
      console.error('❌ Σφάλμα togglePush:', error);
      Alert.alert('Σφάλμα', error.message);
    }
  };

  const testNotification = async () => {
    try {
      await sendLocalNotification('🚗 ParkShare', 'Δοκιμαστική ειδοποίηση!');
    } catch (error) {
      console.error('❌ Σφάλμα test:', error);
      Alert.alert('Σφάλμα', 'Δεν μπόρεσε να σταλεί η ειδοποίηση.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>🔔 Ειδοποιήσεις</Text>

      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Ενεργοποίηση Push</Text>
          <Switch
            value={pushEnabled}
            onValueChange={togglePush}
            trackColor={{ false: '#ddd', true: COLORS.primary }}
          />
        </View>
        <Text style={styles.helperText}>
          Λάβετε ειδοποιήσεις για νέες κρατήσεις, πληρωμές και υπενθυμίσεις.
        </Text>
      </View>

      {pushToken && (
        <View style={styles.card}>
          <Text style={styles.label}>Push Token</Text>
          <Text style={styles.tokenText} numberOfLines={2}>
            {pushToken}
          </Text>
        </View>
      )}

      <TouchableOpacity style={styles.testButton} onPress={testNotification}>
        <Text style={styles.testButtonText}>🧪 Δοκιμαστική Ειδοποίηση</Text>
      </TouchableOpacity>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>📋 Τι ειδοποιήσεις θα λαμβάνετε:</Text>
        <Text style={styles.infoItem}>• 🔔 Νέα κράτηση στη θέση σου</Text>
        <Text style={styles.infoItem}>• ✅ Επιβεβαίωση πληρωμής</Text>
        <Text style={styles.infoItem}>• ⏰ Υπενθύμιση λήξης κράτησης</Text>
        <Text style={styles.infoItem}>• 💰 Μεταφορά χρημάτων</Text>
        <Text style={styles.infoItem}>• ❌ Ακύρωση κράτησης</Text>
        <Text style={styles.infoItem}>• ⭐ Νέα αξιολόγηση</Text>
      </View>
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
  card: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  helperText: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 8,
  },
  tokenText: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 4,
  },
  testButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  testButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  infoCard: {
    backgroundColor: '#e8f0fe',
    padding: 16,
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  infoItem: {
    fontSize: 14,
    color: COLORS.text,
    marginTop: 4,
  },
});