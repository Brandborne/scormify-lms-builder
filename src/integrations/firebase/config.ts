import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase with debug logging
console.log('Initializing Firebase with config:', {
  ...firebaseConfig,
  apiKey: '[REDACTED]', // Don't log the API key
  storageBucket: firebaseConfig.storageBucket // Explicitly log the bucket
});

const app = initializeApp(firebaseConfig);

// Initialize Cloud Storage with explicit bucket URL
const storage = getStorage(app);

console.log('Firebase Storage initialized');

export { storage };