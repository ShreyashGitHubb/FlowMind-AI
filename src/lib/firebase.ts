import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as fbSignOut } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "your-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "your-auth-domain",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "your-storage-bucket",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "your-sender-id",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "your-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Auth Helpers
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Auth error:", error);
    return null;
  }
};

export const signOut = () => fbSignOut(auth);

// Stadium State Helpers
export const syncStadiumState = async (state: Record<string, unknown>) => {
  if (!db) return;
  try {
    const stadiumRef = doc(db, "stadium", "current_state");
    await setDoc(stadiumRef, JSON.parse(JSON.stringify(state)));
  } catch (e) {
    console.error("Firebase sync error:", e);
  }
};

export const listenToStadiumState = (callback: (state: Record<string, unknown>) => void) => {
  const stadiumRef = doc(db, "stadium", "current_state");
  return onSnapshot(stadiumRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data());
    }
  });
};

// Organizer Event Helpers
export const triggerEvent = async (eventName: string, payload: Record<string, unknown>) => {
  const eventRef = doc(db, "stadium", "active_events");
  await updateDoc(eventRef, { [eventName]: payload });
};

