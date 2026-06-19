/**
 * Firebase Client SDK Initializer
 *
 * Supports Mock Mode automatically when NEXT_PUBLIC_FIREBASE_API_KEY
 * starts with "mock_" (the default for local development).
 * No code changes needed — just replace credentials in .env for production.
 *
 * Setup:
 * 1. Create a Firebase project at https://console.firebase.google.com
 * 2. Enable Firebase Storage
 * 3. Copy the web app config keys into frontend/.env
 * 4. Restart the dev server
 */

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const MOCK_PREFIX = 'mock_';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '',
};

/** True when any credential value starts with "mock_" */
export const isFirebaseMockMode: boolean =
  Object.values(firebaseConfig).some((v) => v.startsWith(MOCK_PREFIX)) ||
  Object.values(firebaseConfig).some((v) => v === '');

let app: FirebaseApp | null = null;
let storage: FirebaseStorage | null = null;

if (!isFirebaseMockMode) {
  app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);
  storage = getStorage(app);

  if (process.env.NODE_ENV !== 'production') {
    console.log('✅ Firebase Client SDK initialized.');
  }
} else {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      '⚠️ Firebase Client SDK: Running in MOCK MODE. ' +
        'Uploads will be simulated. Set NEXT_PUBLIC_FIREBASE_* in .env for production.'
    );
  }
}

export { storage };
export default app;
