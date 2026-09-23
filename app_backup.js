import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import ListScreen from './screens/ListScreen';
import MapScreen from './screens/MapScreen';
import AddSpotScreen from './screens/AddSpotScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  const [spotCount, setSpotCount] = useState(0);

  // Φόρτωσε τον αριθμό των θέσεων για το badge
  useEffect(() => {
    const fetchSpotCount = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "spots"));
        setSpotCount(querySnapshot.size);
      } catch (error) {
        console.error("Σφάλμα φόρτωσης αριθμού θέσεων:", error);
      }
    };
    fetchSpotCount();
  }, []);

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Λίστα') {
              iconName = focused ? 'list' : 'list-outline';
            } else if (route.name === 'Χάρτης') {
              iconName = focused ? 'map' : 'map-outline';
            } else if (route.name === 'Προσθήκη') {
              iconName = focused ? 'add-circle' : 'add-circle-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#0d47a1',   // Σκούρο μπλε για το ενεργό
          tabBarInactiveTintColor: '#757575', // Γκρι για τα ανενεργά
          tabBarStyle: {
            height: 70,
            paddingBottom: 8,
            paddingTop: 8,
            backgroundColor: '#ffffff',
            borderTopWidth: 1,
            borderTopColor: '#e0e0e0',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 5,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            marginTop: 2,
          },
          tabBarBadge: route.name === 'Λίστα' && spotCount > 0 ? spotCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: '#1a73e8',
            color: 'white',
            fontSize: 10,
            fontWeight: 'bold',
            minWidth: 18,
            height: 18,
            borderRadius: 9,
            paddingHorizontal: 4,
          },
        })}
      >
        <Tab.Screen name="Λίστα" component={ListScreen} />
        <Tab.Screen name="Χάρτης" component={MapScreen} />
        <Tab.Screen 
          name="Προσθήκη" 
          component={AddSpotScreen}
          options={{
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons 
                name={focused ? 'add-circle' : 'add-circle-outline'} 
                size={size + 4} 
                color={focused ? '#4CAF50' : '#757575'} 
              />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}