import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const rawKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '';

const getDecodedKey = (keyStr: string): string => {
  if (!keyStr) return '';
  if (keyStr.startsWith('b64:')) {
    const b64Part = keyStr.slice(4);
    try {
      if (typeof window !== 'undefined' && typeof window.atob === 'function') {
        return window.atob(b64Part);
      }
      if (typeof Buffer !== 'undefined') {
        return Buffer.from(b64Part, 'base64').toString('utf-8');
      }
    } catch {
      return b64Part;
    }
  }
  return keyStr;
};

const apiKey = getDecodedKey(rawKey);

const firebaseConfig = {
  apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'cinerank-media-tracker.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'cinerank-media-tracker',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'cinerank-media-tracker.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '370819170283',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:370819170283:web:1912d1d6b526acb4c023ae',
};

// Initialize Firebase App singleton safely
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const isFirebaseConfigured = Boolean(
  apiKey &&
  apiKey !== 'demo-key' &&
  !apiKey.includes('YourApiKeyHere')
);

export default app;
