import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut
} from "firebase/auth";
import { auth, googleProvider, isFirebaseConfigured } from "@/lib/firebase";

function assertFirebaseConfig() {
  if (!isFirebaseConfigured() || !auth) {
    throw new Error(
      "Firebase nie jest jeszcze skonfigurowany. Uzupełnij plik .env.local danymi projektu."
    );
  }
}

export async function signInWithGoogle() {
  assertFirebaseConfig();
  await signInWithPopup(auth, googleProvider);
}

export async function registerWithEmail(email, password) {
  assertFirebaseConfig();
  await createUserWithEmailAndPassword(auth, email, password);
}

export async function loginWithEmail(email, password) {
  assertFirebaseConfig();
  await signInWithEmailAndPassword(auth, email, password);
}

export async function logoutUser() {
  assertFirebaseConfig();
  await signOut(auth);
}