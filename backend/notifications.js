const { Expo } = require('expo-server-sdk');

const expo = new Expo();

/**
 * Στέλνει push notification σε ένα ή πολλά tokens
 */
const sendPushNotification = async (tokens, title, body, data = {}) => {
  if (!tokens || tokens.length === 0) {
    console.log('⚠️ Δεν υπάρχουν tokens');
    return;
  }

  // Φιλτράρουμε μόνο τα valid tokens
  const validTokens = tokens.filter((token) => Expo.isExpoPushToken(token));

  if (validTokens.length === 0) {
    console.log('⚠️ Δεν υπάρχουν έγκυρα tokens');
    return;
  }

  const messages = validTokens.map((token) => ({
    to: token,
    sound: 'default',
    title: title,
    body: body,
    data: data,
  }));

  try {
    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];

    for (const chunk of chunks) {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    }

    console.log('✅ Ειδοποιήσεις στάλθηκαν:', tickets.length);
    return tickets;
  } catch (error) {
    console.error('❌ Σφάλμα αποστολής:', error);
  }
};

module.exports = { sendPushNotification };