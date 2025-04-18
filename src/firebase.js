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

// Add user profile creation
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(userRef);

    if (!docSnap.exists()) {
      try {
        // Create a new user document with the updated structure
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          phone: user.phoneNumber || '',
          membership: 'free', // Default membership
          searchLimit: 5, // Free users get 5 searches
          searchesUsed: 0, // No searches used yet
          expirationDate: null, // No expiration date
          paymentId: null, // No payment ID
          createdAt: new Date(), // Account creation date
        });
        console.log('New user document created for:', user.uid);
      } catch (error) {
        console.error('Error creating user document:', error);
      }
    } else {
      console.log('User document already exists for:', user.uid);
      console.log('User Data:', docSnap.data());
    }
  } else {
    console.log('User is not authenticated.');
  }
});

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

