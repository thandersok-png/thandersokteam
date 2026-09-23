import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const registerForPushNotifications = async () => {
  try {
    console.log('🔍 registerForPushNotifications - Start');

    if (!Device.isDevice) {
      console.log('⚠️ Δεν είναι πραγματική συσκευή');
      return null;
    }

    console.log('✅ Είναι πραγματική συσκευή');

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    console.log('📱 Υπάρχουσα άδεια:', existingStatus);

    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      console.log('🔔 Ζητάω άδεια...');
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log('📱 Νέα άδεια:', finalStatus);
    }

    if (finalStatus !== 'granted') {
      console.log('❌ Δεν δόθηκε άδεια');
      return null;
    }

    console.log('✅ Άδεια OK');

    if (Platform.OS === 'android') {
      try {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
        console.log('✅ Κανάλι ειδοποιήσεων OK');
      } catch (err) {
        console.error('⚠️ Σφάλμα καναλιού:', err);
      }
    }

    console.log('🎫 Παίρνω push token...');
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('✅ Push Token:', token);

    const user = auth.currentUser;
    if (user) {
      await setDoc(
        doc(db, 'users', user.uid),
        { pushToken: token },
        { merge: true }
      );
      console.log('✅ Token αποθηκεύτηκε');
    }

    return token;
  } catch (error) {
    console.error('❌ Σφάλμα registerForPushNotifications:', error);
    return null;
  }
};

export const sendLocalNotification = async (title, body) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: title,
        body: body,
        sound: true,
      },
      trigger: null,
    });
  } catch (error) {
    console.error('❌ Σφάλμα sendLocalNotification:', error);
  }
};