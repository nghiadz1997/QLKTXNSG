import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyACg9RfxTcXT7hr0VknJN-2wvfpl1jT-ok',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'qlktxnsg.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'qlktxnsg',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'qlktxnsg.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '476374592242',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:476374592242:web:422231147b3fb3591b7e6b',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-FHLX18HE64',
};

// Check if actual production credentials are provided
export const isRealFirebaseConfigured = true;

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize Analytics if supported in environment
let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== 'undefined') {
  isSupported().then(supported => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {});
}
export { analytics };

export default app;

