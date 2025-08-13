
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCaJaxzpsLe-d1D9b0v9rFSM1yZR68QsR0",
  authDomain: "eduverse-98jdv.firebaseapp.com",
  projectId: "eduverse-98jdv",
  storageBucket: "eduverse-98jdv.appspot.com",
  messagingSenderId: "1033061760650",
  appId: "1:1033061760650:web:192ad12f7649972151b773"
};

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}


const auth = getAuth(app);
const storage = getStorage(app);
const db = getFirestore(app);

export { app, auth, storage, db };
