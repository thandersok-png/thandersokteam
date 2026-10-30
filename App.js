import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { auth } from './firebase';
import { LanguageProvider, Text, useLanguage } from './i18n';
import AddSpotScreen from './screens/AddSpotScreen';
import BookingScreen from './screens/BookingScreen';
import ListScreen from './screens/ListScreen';
import LoginScreen from './screens/LoginScreen';
import MapScreen from './screens/MapScreen';
import MySpotsScreen from './screens/MySpotsScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import OwnerGuideScreen from './screens/OwnerGuideScreen';
import OwnerStripeSetupScreen from './screens/OwnerStripeSetupScreen';
import PaymentScreen from './screens/PaymentScreen';
import PrivacyPolicyScreen from './screens/PrivacyPolicyScreen';
import ProfileScreen from './screens/ProfileScreen';
import QRCodeScreen from './screens/QRCodeScreen';
import QRScannerScreen from './screens/QRScannerScreen';
import RegisterScreen from './screens/RegisterScreen';
import ReviewsScreen from './screens/ReviewsScreen';
import COLORS from './theme/colors';

const Drawer = createDrawerNavigator();
const AuthStack = createNativeStackNavigator();

const drawerIcons = {
  Λίστα: 'list',
  Χάρτης: 'map',
  Προσθήκη: 'add-circle',
  'Οι Θέσεις μου': 'car',
  'Σύνδεση Stripe': 'card',
  Ειδοποιήσεις: 'notifications',
  Προφίλ: 'person',
  'Οδηγός Ιδιοκτήτη': 'book',
};

function AppDrawer() {
  const { language } = useLanguage();
  const english = language === 'en';
  return (
    <Drawer.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        drawerActiveTintColor: COLORS.primary,
        drawerInactiveTintColor: COLORS.text,
        drawerLabelStyle: { fontSize: 15 },
        drawerIcon: ({ color, size }) => (
          <Ionicons
            name={drawerIcons[route.name] || 'ellipse'}
            size={size}
            color={color}
          />
        ),
      })}
    >
      <Drawer.Screen name="Λίστα" component={ListScreen} options={{ title: english ? 'List' : 'Λίστα' }} />
      <Drawer.Screen name="Χάρτης" component={MapScreen} options={{ title: english ? 'Map' : 'Χάρτης' }} />
      <Drawer.Screen name="Προσθήκη" component={AddSpotScreen} options={{ title: english ? 'Add a spot' : 'Προσθήκη' }} />
      <Drawer.Screen name="Οι Θέσεις μου" component={MySpotsScreen} options={{ title: english ? 'My spots' : 'Οι Θέσεις μου' }} />
      <Drawer.Screen name="Σύνδεση Stripe" component={OwnerStripeSetupScreen} options={{ title: english ? 'Stripe setup' : 'Σύνδεση Stripe' }} />
      <Drawer.Screen name="Ειδοποιήσεις" component={NotificationsScreen} options={{ title: english ? 'Notifications' : 'Ειδοποιήσεις' }} />
      <Drawer.Screen name="Προφίλ" component={ProfileScreen} options={{ title: english ? 'Profile' : 'Προφίλ' }} />
      <Drawer.Screen
        name="Οδηγός Ιδιοκτήτη"
        component={OwnerGuideScreen}
        options={{ title: english ? 'Owner guide' : 'Οδηγός Ιδιοκτήτη' }}
      />
      <Drawer.Screen
        name="Κράτηση"
        component={BookingScreen}
        options={{ title: english ? 'Booking' : 'Κράτηση', drawerItemStyle: { display: 'none' } }}
      />
      <Drawer.Screen
        name="Payment"
        component={PaymentScreen}
        options={{ title: english ? 'Payment' : 'Πληρωμή', drawerItemStyle: { display: 'none' } }}
      />
      <Drawer.Screen
        name="Reviews"
        component={ReviewsScreen}
        options={{ title: english ? 'Reviews' : 'Αξιολογήσεις', drawerItemStyle: { display: 'none' } }}
      />
      <Drawer.Screen
        name="QRCode"
        component={QRCodeScreen}
        options={{ title: english ? 'QR check-in' : 'QR Check-in', drawerItemStyle: { display: 'none' } }}
      />
      <Drawer.Screen
        name="QRScanner"
        component={QRScannerScreen}
        options={{ title: english ? 'Scan QR code' : 'Σάρωση QR', drawerItemStyle: { display: 'none' } }}
      />
    </Drawer.Navigator>
  );
}

function AuthenticationStack() {
  const { language } = useLanguage();
  const english = language === 'en';
  return (
    <AuthStack.Navigator>
      <AuthStack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <AuthStack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ title: english ? 'Sign up' : 'Εγγραφή' }}
      />
      <AuthStack.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicyScreen}
        options={{ title: english ? 'Privacy Policy' : 'Πολιτική Απορρήτου' }}
      />
    </AuthStack.Navigator>
  );
}

function AppContent() {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const { ready: languageReady } = useLanguage();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setInitializing(false);
      },
      (error) => {
        console.error('Σφάλμα ελέγχου σύνδεσης:', error);
        setInitializing(false);
      }
    );

    return unsubscribe;
  }, []);

  if (initializing || !languageReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Φόρτωση...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <AppDrawer /> : <AuthenticationStack />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.textLight,
    fontSize: 16,
  },
});
