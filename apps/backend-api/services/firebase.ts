// Firebase Admin SDK Setup for ZANTARA v5.2.0
import { initializeApp, getApps, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore as getFirestoreAdmin } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

// Initialize Firebase Admin only once
let initialized = false;

// Export status for health checks
export const firebaseStatus = {
  initialized: false,
  serviceAccountSource: 'none' as 'secret-manager' | 'env-var' | 'file' | 'adc' | 'none',
  error: null as string | null
};

function initializeFirebase() {
  if (initialized || getApps().length > 0) {
    return;
  }

  try {
    const projectId = process.env.GOOGLE_PROJECT_ID || 'involuted-box-469105-r0';

    // Check for environment variable first (local dev)
    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    if (serviceAccountKey) {
      const serviceAccount = JSON.parse(serviceAccountKey);
      initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id || projectId
      });
      console.log('🔥 Firebase initialized with service account from env');
      firebaseStatus.serviceAccountSource = 'env-var';
      firebaseStatus.initialized = true;
      initialized = true;
      return;
    }

    // Check for credentials file (local dev)
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (credentialsPath) {
      try {
        const serviceAccount = JSON.parse(readFileSync(credentialsPath, 'utf8'));
        initializeApp({
          credential: cert(serviceAccount),
          projectId: serviceAccount.project_id || projectId
        });
        console.log('🔥 Firebase initialized with service account from file');
        firebaseStatus.serviceAccountSource = 'file';
        firebaseStatus.initialized = true;
        initialized = true;
        return;
      } catch (fileError) {
        console.log('⚠️ Could not read credentials file, falling back to ADC');
      }
    }

    // Use Application Default Credentials (Cloud Run)
    // Cloud Run service account has secretmanager.secretAccessor role
    // so it can access secrets via ADC
    initializeApp({
      credential: applicationDefault(),
      projectId
    });
    console.log('🔥 Firebase initialized with ADC (Application Default Credentials)');
    console.log('   Service account: cloud-run-deployer@involuted-box-469105-r0.iam.gserviceaccount.com');
    firebaseStatus.serviceAccountSource = 'adc';
    firebaseStatus.initialized = true;
    initialized = true;
  } catch (error: any) {
    console.error('❌ Firebase initialization failed:', error.message);
    firebaseStatus.error = error?.message || 'Unknown error';
    initialized = false;
  }
}

// Initialize on first import
initializeFirebase();

// Export Firestore convenience function
export function getFirestore() {
  if (!initialized) {
    initializeFirebase();
  }
  if (getApps().length === 0) {
    throw new Error('Firebase not initialized. Please check credentials.');
  }
  return getFirestoreAdmin();
}

// Re-export for compatibility
export { getApps } from 'firebase-admin/app';