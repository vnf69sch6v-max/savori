import 'server-only';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        // Use service account if provided (Production/Local explicit)
        try {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
        } catch (error) {
            console.error('Firebase Admin init error', error);
        }
    } else {
        // Fallback or development (might not work without Credentials)
        // Ideally should always use service account in Next.js API Routes meant for production
        console.warn('Missing FIREBASE_SERVICE_ACCOUNT_KEY, specific admin operations might fail.');
        admin.initializeApp();
    }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
