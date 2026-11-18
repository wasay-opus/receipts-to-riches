import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "r2r-firebase-project.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "r2r-firebase-project",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "r2r-firebase-project.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "387421915736",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:387421915736:web:c3f1ee069d8669f7b1982d",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-ZZ4SWT2Q77"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogleFirebase = async (): Promise<string> => {
  const result = await signInWithPopup(auth, googleProvider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  const googleIdToken = credential?.idToken;

  if (googleIdToken) {
    return googleIdToken;
  }

  // Firebase's user ID token is not a Google ID token and cannot be sent to
  // auth/social/login. Let the caller fall back to Google Identity Services.
  throw new Error('Google did not return an ID token.');
};

export default app;
