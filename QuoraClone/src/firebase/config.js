// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDQMZtq62eh2VAJ6wSq61zHphyaCVOHEis",
  authDomain: "quora-82f25.firebaseapp.com",
  projectId: "quora-82f25",
  storageBucket: "quora-82f25.firebasestorage.app",
  messagingSenderId: "1081951012110",
  appId: "1:1081951012110:web:b7fc478370692b08f8c35f",
  measurementId: "G-1MD9928C32"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export default app