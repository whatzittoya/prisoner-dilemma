/**
 * Firebase client SDK (browser + client components).
 *
 * Use this for anything that runs in the user's browser: Firestore/Realtime
 * Database reads & writes gated by Security Rules, Firebase Auth, Analytics.
 * For privileged server-side access that bypasses Security Rules, use the
 * Admin SDK in `./admin` instead.
 *
 * The app is initialized as a singleton so it survives Fast Refresh / repeated
 * imports without throwing "Firebase App named '[DEFAULT]' already exists".
 */
import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getDatabase, type Database } from "firebase/database";
import {
  getAnalytics,
  isSupported,
  type Analytics,
} from "firebase/analytics";

import { firebaseConfig, firestoreDatabaseId } from "./config";

export const firebaseApp: FirebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

/** Firebase Authentication. */
export const auth: Auth = getAuth(firebaseApp);

/** Cloud Firestore (document database) — the configured named database. */
export const db: Firestore =
  firestoreDatabaseId === "(default)"
    ? getFirestore(firebaseApp)
    : getFirestore(firebaseApp, firestoreDatabaseId);

/** Realtime Database (the `...firebasedatabase.app` instance). */
export const rtdb: Database = getDatabase(firebaseApp);

/** Pre-built Google provider for `signInWithPopup(auth, googleProvider)`. */
export const googleProvider = new GoogleAuthProvider();

/**
 * Analytics only works in the browser and only when the environment supports
 * it (e.g. not in SSR, not when blocked). Resolves to `null` on the server or
 * when unsupported, so it is always safe to await.
 */
export async function getFirebaseAnalytics(): Promise<Analytics | null> {
  if (typeof window === "undefined") return null;
  if (!firebaseConfig.measurementId) return null;
  return (await isSupported()) ? getAnalytics(firebaseApp) : null;
}
