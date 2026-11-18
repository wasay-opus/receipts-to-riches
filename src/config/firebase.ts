import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCLGQL--UakdAWnxXMfYsByoDLQsWVnbrg",
  authDomain: "r2r-firebase-project.firebaseapp.com",
  projectId: "r2r-firebase-project",
  storageBucket: "r2r-firebase-project.firebasestorage.app",
  messagingSenderId: "387421915736",
  appId: "1:387421915736:web:c3f1ee069d8669f7b1982d",
  measurementId: "G-ZZ4SWT2Q77"
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
