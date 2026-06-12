/**
 * Firebase Admin SDK (server-only).
 *
 * Runs with full privileges and BYPASSES Security Rules, so this module must
 * never be imported into a client component. Use it from Route Handlers,
 * Server Actions, and Server Components for trusted reads/writes, custom-token
 * minting, and ID-token verification.
 *
 * Credentials are resolved, in order of preference, from:
 *   1. FIREBASE_SERVICE_ACCOUNT_KEY  — the full service-account JSON (one line)
 *   2. FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY
 *   3. GOOGLE_APPLICATION_CREDENTIALS — path handled by applicationDefault()
 *
 * None of these exist by default in `.env.local` — generate a service account
 * key in the Firebase console (Project settings → Service accounts → Generate
 * new private key) and add it before using the Admin SDK. Initialization is
 * lazy, so the rest of the app builds and runs even without these set.
 */
import "server-only";

import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
  type App,
} from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getDatabase, type Database } from "firebase-admin/database";

export { isAdminConfigured } from "./admin-env";

const ADMIN_APP_NAME = "admin";
const databaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;

function resolveCredential() {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccountJson) {
    return cert(JSON.parse(serviceAccountJson));
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // Env vars store `\n` literally; restore real newlines for the PEM body.
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (projectId && clientEmail && privateKey) {
    return cert({ projectId, clientEmail, privateKey });
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return applicationDefault();
  }

  throw new Error(
    "Firebase Admin credentials are missing. Set FIREBASE_SERVICE_ACCOUNT_KEY, " +
      "or FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY, " +
      "or GOOGLE_APPLICATION_CREDENTIALS. See src/lib/firebase/admin.ts.",
  );
}

/** Returns the singleton Admin app, initializing it on first use. */
export function getAdminApp(): App {
  const existing = getApps().find((app) => app.name === ADMIN_APP_NAME);
  if (existing) return existing;

  return initializeApp(
    {
      credential: resolveCredential(),
      ...(databaseURL ? { databaseURL } : {}),
    },
    ADMIN_APP_NAME,
  );
}

export const adminAuth = (): Auth => getAuth(getAdminApp());
export const adminDb = (): Firestore => getFirestore(getAdminApp());
export const adminRtdb = (): Database => getDatabase(getAdminApp());
