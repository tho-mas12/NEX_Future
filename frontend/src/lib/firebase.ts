import { initializeApp, getApps, getApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import type { Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import type { FirebaseStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';
import type { Analytics } from 'firebase/analytics';

/**
 * Firebase Client Configuration for NEX Education Platform.
 * Loads variables from Vite environment (import.meta.env).
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
};

/**
 * Validates if valid Firebase credentials have been provided in .env
 */
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  !firebaseConfig.apiKey.includes('Placeholder')
);

// Prevent re-initialization in Fast Refresh / HMR environments
let app: FirebaseApp;
if (getApps().length > 0) {
  app = getApp();
} else if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig);
} else {
  // Provide mock/dummy app initialization so importing auth/db never throws at runtime
  app = initializeApp({
    apiKey: 'AIzaSyDummyKeyForDevelopment1234567890',
    projectId: 'nex-educational-platform',
    appId: '1:123456789012:web:abcdef1234567890',
  });
}

export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);

export let analytics: Analytics | null = null;
if (typeof window !== 'undefined' && isFirebaseConfigured) {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export default app;
