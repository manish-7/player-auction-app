import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Firebase configuration
// You'll need to replace these with your actual Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDHqDrfsArJwEhbTdm29Q5WWf7k0hvQfYg",
  authDomain: "player-auction-app-mj.firebaseapp.com",
  databaseURL: "https://player-auction-app-mj-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "player-auction-app-mj",
  storageBucket: "player-auction-app-mj.firebasestorage.app",
  messagingSenderId: "808004286454",
  appId: "1:808004286454:web:662c5821a838562c20f9d7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database and get a reference to the service
export const database = getDatabase(app);

// Check if Firebase is properly configured
export const isFirebaseConfigured = true; // Since you have real config

// Log Firebase initialization for debugging
console.log('Firebase initialized with project:', firebaseConfig.projectId);

export default app;
