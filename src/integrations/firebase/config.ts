import { initializeApp, FirebaseApp } from 'firebase/app';
import { getStorage, FirebaseStorage } from 'firebase/storage';

let app: FirebaseApp;
let storage: FirebaseStorage;

export async function initializeFirebaseStorage(config: any) {
  try {
    if (!config.storageBucket) {
      throw new Error('Storage bucket is not configured');
    }

    // Check if Firebase is already initialized
    if (!app) {
      console.log('Initializing Firebase with config:', {
        projectId: config.projectId,
        storageBucket: config.storageBucket,
        authDomain: config.authDomain
      });

      app = initializeApp(config);
      storage = getStorage(app);
      
      console.log('Firebase Storage initialized successfully');
    }

    return storage;
  } catch (error) {
    console.error('Firebase initialization failed:', error);
    throw error;
  }
}

export function getFirebaseStorage(): FirebaseStorage {
  if (!storage) {
    throw new Error('Firebase Storage not initialized. Call initializeFirebaseStorage first.');
  }
  return storage;
}