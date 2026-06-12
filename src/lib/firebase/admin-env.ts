/**
 * Env-only check for whether Firebase Admin credentials are present.
 *
 * Lives in its own module (no `firebase-admin` import) so server components can
 * read the status cheaply without pulling the heavy Admin SDK — and its native
 * deps — into the bundle.
 */
export const isAdminConfigured = Boolean(
  process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
    (process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY) ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
);
