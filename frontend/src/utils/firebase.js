// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "nextcode-bfb38.firebaseapp.com",
  projectId: "nextcode-bfb38",
  storageBucket: "nextcode-bfb38.firebasestorage.app",
  messagingSenderId: "225778677165",
  appId: "1:225778677165:web:6be5d558610dfe872fdd24",
  measurementId: "G-0NTNWGLEWT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();