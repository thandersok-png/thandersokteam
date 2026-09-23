import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyAPjAE4jjxtINr8oq7yv7udCk6nc9QchFU',
  authDomain: 'parckshare.firebaseapp.com',
  projectId: 'parckshare',
  storageBucket: 'parckshare.firebasestorage.app',
  messagingSenderId: '833584209576',
  appId: '1:833584209576:web:5a6344d2386a6b54c2ac9d',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
export default app;