import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { supabase } from '@/integrations/supabase/client';

let storage: ReturnType<typeof getStorage>;

async function initializeFirebase() {
  try {
    console.log('Fetching Firebase configuration from Edge Function...');
    
    const { data, error } = await supabase.functions.invoke('get-firebase-config');
    
    if (error) {
      console.error('Failed to fetch Firebase config:', error);
      throw error;
    }

    const firebaseConfig = data;

    console.log('Initializing Firebase with config:', {
      projectId: firebaseConfig.projectId,
      storageBucket: firebaseConfig.storageBucket,
      authDomain: firebaseConfig.authDomain
    });

    if (!firebaseConfig.storageBucket) {
      throw new Error('Storage bucket is not configured!');
    }

    const app = initializeApp(firebaseConfig);
    storage = getStorage(app);

    console.log('Firebase Storage initialized with bucket:', firebaseConfig.storageBucket);
  } catch (error) {
    console.error('Firebase initialization failed:', error);
    throw error;
  }
}

// Initialize Firebase when this module is imported
initializeFirebase().catch(console.error);

// Export a function to get the storage instance
export function getFirebaseStorage() {
  if (!storage) {
    throw new Error('Firebase Storage not initialized');
  }
  return storage;
}