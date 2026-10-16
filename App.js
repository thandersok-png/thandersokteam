import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { auth } from './firebase';
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
      <Drawer.Screen name="Λίστα" component={ListScreen} />
      <Drawer.Screen name="Χάρτης" component={MapScreen} />
      <Drawer.Screen name="Προσθήκη" component={AddSpotScreen} />
      <Drawer.Screen name="Οι Θέσεις μου" component={MySpotsScreen} />
      <Drawer.Screen name="Σύνδεση Stripe" component={OwnerStripeSetupScreen} />
      <Drawer.Screen name="Ειδοποιήσεις" component={NotificationsScreen} />
      <Drawer.Screen name="Προφίλ" component={ProfileScreen} />
      <Drawer.Screen
        name="Οδηγός Ιδιοκτήτη"
        component={OwnerGuideScreen}
        options={{ title: 'Οδηγός Ιδιοκτήτη' }}
      />
      <Drawer.Screen
        name="Κράτηση"
        component={BookingScreen}
        options={{ drawerItemStyle: { display: 'none' } }}
      />
      <Drawer.Screen
        name="Payment"
        component={PaymentScreen}
        options={{ drawerItemStyle: { display: 'none' } }}
      />
      <Drawer.Screen
        name="Reviews"
        component={ReviewsScreen}
        options={{ drawerItemStyle: { display: 'none' } }}
      />
      <Drawer.Screen
        name="QRCode"
        component={QRCodeScreen}
        options={{ drawerItemStyle: { display: 'none' } }}
      />
      <Drawer.Screen
        name="QRScanner"
        component={QRScannerScreen}
        options={{ drawerItemStyle: { display: 'none' } }}
      />
    </Drawer.Navigator>
  );
}

function AuthenticationStack() {
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
        options={{ title: 'Εγγραφή' }}
      />
      <AuthStack.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicyScreen}
        options={{ title: 'Πολιτική Απορρήτου' }}
      />
    </AuthStack.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

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

  if (initializing) {
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
