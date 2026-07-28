import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const rawKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'demo-key';
const apiKey = rawKey.startsWith('b64:')
  ? (typeof window !== 'undefined' ? atob(rawKey.slice(4)) : Buffer.from(rawKey.slice(4), 'base64').toString('utf-8'))
  : rawKey;

const firebaseConfig = {
  apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'demo-project.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'demo-project.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:123456789:web:abcdef',
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

export const isFirebaseConfigured = Boolean(
  apiKey &&
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
  apiKey !== 'demo-key' &&
  !apiKey.includes('YourApiKeyHere')
);

export default app;
