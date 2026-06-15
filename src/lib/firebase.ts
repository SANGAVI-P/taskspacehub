import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: any = null;
let auth: any = null;
let db: any = null;
let isFirebaseConfigured = false;

// Check if keys are placeholders or empty
const hasPlaceholderKey = 
  !firebaseConfig.apiKey || 
  firebaseConfig.apiKey === 'your-api-key' || 
  firebaseConfig.apiKey.trim() === '';

if (!hasPlaceholderKey) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    isFirebaseConfigured = true;
    console.log("Firebase initialized successfully in Live Mode.");
  } catch (error) {
    console.error("Failed to initialize Firebase:", error);
  }
} else {
  console.log("Firebase initialized in Sandbox Fallback Mode (placeholder keys detected).");
}

export { app, auth, db, isFirebaseConfigured };
export default app;
