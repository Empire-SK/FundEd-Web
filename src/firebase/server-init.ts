// IMPORTANT: This file is only intended for use on the server-side,
// for example in API routes or server components. It uses the Firebase Admin SDK.
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { firebaseConfig } from '@/firebase/config';

// This is a simplified check. In a real app, you'd use a secure way to load
// service account credentials, like environment variables or a secret manager.
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : undefined;

let adminApp: App;

if (!getApps().length) {
  if (serviceAccount) {
    adminApp = initializeApp({
      credential: cert(serviceAccount),
      databaseURL: `https://${firebaseConfig.projectId}.firebaseio.com`,
    });
  } else {
    // Fallback for environments without service account (e.g., local dev)
    // This will have limited permissions.
    adminApp = initializeApp({ projectId: firebaseConfig.projectId });
    console.warn("Firebase Admin SDK initialized without service account credentials. This is not recommended for production.");
  }
} else {
  adminApp = getApps()[0];
}

const firestore = getFirestore(adminApp);

export const initializeFirebase = () => ({
  firestore,
  app: adminApp,
});
