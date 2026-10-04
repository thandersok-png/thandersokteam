import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { StripeProvider } from '@stripe/stripe-react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { STRIPE_PUBLISHABLE_KEY } from './stripe';
import COLORS from './theme/colors';

import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import ListScreen from './screens/ListScreen';
import MapScreen from './screens/MapScreen';
import AddSpotScreen from './screens/AddSpotScreen';
import BookingScreen from './screens/BookingScreen';
import PaymentScreen from './screens/PaymentScreen';
import ProfileScreen from './screens/ProfileScreen';
import MySpotsScreen from './screens/MySpotsScreen';
import ReviewsScreen from './screens/ReviewsScreen';
import PrivacyPolicyScreen from './screens/PrivacyPolicyScreen';
import QRCodeScreen from './screens/QRCodeScreen';
import QRScannerScreen from './screens/QRScannerScreen';
import OwnerStripeSetupScreen from './screens/OwnerStripeSetupScreen';
import NotificationsScreen from './screens/NotificationsScreen';

const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

function MainDrawer() {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.surface },
        headerTitleStyle: { color: COLORS.text, fontSize: 18, fontWeight: '700' },
        headerTintColor: COLORS.primary,
        headerShadowVisible: false,
        sceneContainerStyle: { backgroundColor: COLORS.background },
        drawerStyle: { backgroundColor: COLORS.surface, width: 300 },
        drawerActiveTintColor: COLORS.primary,
        drawerInactiveTintColor: COLORS.textLight,
        drawerActiveBackgroundColor: COLORS.surfaceTint,
        drawerItemStyle: { borderRadius: 12, marginHorizontal: 10, marginVertical: 3 },
        drawerLabelStyle: { fontSize: 15, fontWeight: '600' },
      }}
    >
      <Drawer.Screen
        name="Λίστα"
        component={ListScreen}
        options={{
          title: 'ParkShare',
          drawerIcon: ({ color, size }) => <Ionicons name="list" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="Χάρτης"
        component={MapScreen}
        options={{
          title: 'Χάρτης',
          drawerIcon: ({ color, size }) => <Ionicons name="map" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="Προσθήκη"
        component={AddSpotScreen}
        options={{
          title: 'Προσθήκη Θέσης',
          drawerIcon: ({ color, size }) => <Ionicons name="add-circle" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="Οι Θέσεις μου"
        component={MySpotsScreen}
        options={{
          title: 'Οι Θέσεις μου',
          drawerIcon: ({ color, size }) => <Ionicons name="car" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="Ειδοποιήσεις"
        component={NotificationsScreen}
        options={{
          title: 'Ειδοποιήσεις',
          drawerIcon: ({ color, size }) => <Ionicons name="notifications" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="Προφίλ"
        component={ProfileScreen}
        options={{
          title: 'Προφίλ',
          drawerIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="Σάρωση QR"
        component={QRScannerScreen}
        options={{
          title: 'Check-in με QR',
          drawerIcon: ({ color, size }) => <Ionicons name="qr-code" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="Stripe Setup"
        component={OwnerStripeSetupScreen}
        options={{
          title: 'Σύνδεση Stripe',
          drawerIcon: ({ color, size }) => <Ionicons name="card" size={size} color={color} />,
        }}
      />
    </Drawer.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ headerShown: true, title: 'Πολιτική Απορρήτου' }} />
    </Stack.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) return null;

  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName={user ? 'Main' : 'Auth'}>
          {user ? (
            <>
              <Stack.Screen name="Main" component={MainDrawer} options={{ headerShown: false }} />
              <Stack.Screen name="Κράτηση" component={BookingScreen} options={{ title: 'Κράτηση' }} />
              <Stack.Screen name="Payment" component={PaymentScreen} options={{ title: 'Πληρωμή' }} />
              <Stack.Screen name="OwnerStripeSetup" component={OwnerStripeSetupScreen} options={{ title: 'Σύνδεση Stripe' }} />
              <Stack.Screen name="Reviews" component={ReviewsScreen} options={{ title: 'Αξιολογήσεις' }} />
              <Stack.Screen name="QRCode" component={QRCodeScreen} options={{ title: 'QR Check-in' }} />
              <Stack.Screen name="QRScanner" component={QRScannerScreen} options={{ title: 'Σάρωση QR' }} />
            </>
          ) : (
            <Stack.Screen name="Auth" component={AuthStack} options={{ headerShown: false }} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </StripeProvider>
  );
}