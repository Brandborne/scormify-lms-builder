import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

let storage: ReturnType<typeof getStorage>;

export async function initializeFirebaseStorage(config: any) {
  try {
    console.log('Initializing Firebase with config:', {
      projectId: config.projectId,
      storageBucket: config.storageBucket,
      authDomain: config.authDomain
    });

    if (!config.storageBucket) {
      throw new Error('Storage bucket is not configured!');
    }

    const app = initializeApp(config);
    storage = getStorage(app);

    console.log('Firebase Storage initialized with bucket:', config.storageBucket);
    return storage;
  } catch (error) {
    console.error('Firebase initialization failed:', error);
    throw error;
  }
}

// Export a function to get the storage instance
export function getFirebaseStorage() {
  if (!storage) {
    throw new Error('Firebase Storage not initialized');
  }
  return storage;
}