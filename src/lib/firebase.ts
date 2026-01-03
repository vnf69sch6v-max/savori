import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getAI, getGenerativeModel } from 'firebase/ai';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase (prevent re-initialization in hot reload)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Auth
export const auth = getAuth(app);

// Firestore
export const db = getFirestore(app);

// Enable offline persistence (client-side only)
if (typeof window !== 'undefined') {
  import('firebase/firestore').then(({ enableIndexedDbPersistence }) => {
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('Firestore persistence enabled in another tab');
      } else if (err.code === 'unimplemented') {
        console.warn('Firestore persistence not supported');
      }
    });
  });
}

// Storage
export const storage = getStorage(app);

// Connect to Emulators
// Set NEXT_PUBLIC_USE_EMULATORS=true in .env.local to enable
if (process.env.NEXT_PUBLIC_USE_EMULATORS === 'true' && typeof window !== 'undefined') {
  // Only connect once
  // @ts-ignore
  if (!window._firebase_emulators_connected) {
    console.log('🔧 Connecting to Firebase Emulators...');
    import('firebase/auth').then(({ connectAuthEmulator }) => {
      connectAuthEmulator(auth, 'http://127.0.0.1:9099');
    });
    import('firebase/firestore').then(({ connectFirestoreEmulator }) => {
      connectFirestoreEmulator(db, '127.0.0.1', 8080);
    });
    import('firebase/storage').then(({ connectStorageEmulator }) => {
      connectStorageEmulator(storage, '127.0.0.1', 9199);
    });
    // @ts-ignore
    window._firebase_emulators_connected = true;
    console.log('✅ Connected to Firebase Emulators');
  }
}

// Firebase AI (Gemini via Firebase)
export const firebaseAI = getAI(app);

// Helper to get AI model
export const getAIModel = (modelName: string = 'gemini-2.0-flash') => {
  return getGenerativeModel(firebaseAI, { model: modelName });
};

// Analytics (client-side only)
export const initAnalytics = async () => {
  if (typeof window !== 'undefined' && await isSupported()) {
    return getAnalytics(app);
  }
  return null;
};

export default app;
