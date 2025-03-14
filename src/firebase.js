import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  OAuthProvider,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { onAuthStateChanged } from 'firebase/auth';
import { getDoc, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

if (!firebaseConfig.apiKey) {
  console.error('Missing Firebase configuration!');
  throw new Error('Firebase configuration error');
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Google and Apple Providers
const googleProvider = new GoogleAuthProvider();
const appleProvider = new OAuthProvider('apple.com');

export {
  auth,
  db,
  storage,
  googleProvider,
  appleProvider,
  signInWithPopup,
  signInWithRedirect,
};
export default app;
// Add user profile creation
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(userRef);
    if (!docSnap.exists()) {
      await setDoc(userRef, {
        email: user.email,
        phone: user.phoneNumber || '',
        membership: 'Free',
        searches: [],
        createdAt: new Date(),
      });
    }
  }
});
