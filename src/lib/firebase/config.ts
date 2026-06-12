/**
 * Firebase client configuration.
 *
 * These values come from the Firebase console (Project settings → Your apps)
 * and are safe to expose to the browser — they identify the project, they do
 * not grant access. Real access control is enforced by Firebase Security Rules.
 *
 * All values are read from `NEXT_PUBLIC_*` environment variables (see
 * `.env.local` / `.env.local.example`).
 */
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
} as const;

/** True when the minimum config needed to talk to Firebase is present. */
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId,
);

/**
 * Which Cloud Firestore database to use. Firestore supports multiple named
 * databases per project; this app uses the "experiment" database to keep its
 * data separate from the project's "(default)" database. Override via env.
 */
export const firestoreDatabaseId =
  process.env.NEXT_PUBLIC_FIRESTORE_DATABASE_ID ?? "experiment";
