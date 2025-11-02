// Firebase Admin SDK Setup for ZANTARA v5.2.0
import logger from './logger.js';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { initializeApp, getApps, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore as getFirestoreAdmin } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

type ServiceAccountSource = 'secret-manager' | 'env-var' | 'file' | 'adc' | 'none';

const DEFAULT_PROJECT_ID =
  process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_PROJECT_ID || 'involuted-box-469105-r0';
const SERVICE_ACCOUNT_SECRET = process.env.FIREBASE_SERVICE_ACCOUNT_SECRET || 'zantara-service-account-2025';

let initialized = false;
let initializing: Promise<void> | null = null;

export const firebaseStatus = {
  initialized: false,
  serviceAccountSource: 'none' as ServiceAccountSource,
  error: null as string | null,
};

async function fetchServiceAccountFromSecret(projectId: string) {
  // Skip Secret Manager on Fly.io (no ADC available)
  if (process.env.SKIP_SECRET_MANAGER === 'true') {
    logger.info('⚠️ Secret Manager skipped (SKIP_SECRET_MANAGER=true)');
    return null;
  }

  try {
    const client = new SecretManagerServiceClient({ projectId });
    const secretName = `projects/${projectId}/secrets/${SERVICE_ACCOUNT_SECRET}/versions/latest`;
    const [version] = await client.accessSecretVersion({ name: secretName });
    const payload = version.payload?.data?.toString();

    if (payload) {
      logger.info(`🔥 Firebase service account loaded from Secret Manager: ${secretName}`);
      firebaseStatus.serviceAccountSource = 'secret-manager';
      return JSON.parse(payload);
    }
  } catch (error: any) {
    logger.info('⚠️ Secret Manager lookup failed, falling back to other credentials:', error?.message || error);
  }

  return null;
}

async function initializeFirebaseInternal(): Promise<void> {
  if (initialized || getApps().length > 0) {
    firebaseStatus.initialized = true;
    firebaseStatus.error = null;
    return;
  }

  const projectId = DEFAULT_PROJECT_ID;

  try {
    let serviceAccount: Record<string, any> | null = await fetchServiceAccountFromSecret(projectId);

    if (!serviceAccount) {
      const envKey = process.env.GOOGLE_SERVICE_ACCOUNT || process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
      if (envKey) {
        serviceAccount = JSON.parse(envKey);
        logger.info('🔥 Firebase initialized with service account from env variable');
        firebaseStatus.serviceAccountSource = 'env-var';
      }
    }

    if (!serviceAccount) {
      const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      if (credentialsPath) {
        try {
          const fileAccount = JSON.parse(readFileSync(credentialsPath, 'utf8'));
          serviceAccount = fileAccount;
          logger.info(`🔥 Firebase initialized with service account from file (${credentialsPath})`);
          firebaseStatus.serviceAccountSource = 'file';
        } catch (fileError: any) {
          logger.info('⚠️ Could not read credentials file, falling back to ADC:', fileError?.message || fileError);
        }
      }
    }

    if (serviceAccount) {
      initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id || projectId,
      });
    } else {
      initializeApp({
        credential: applicationDefault(),
        projectId,
      });
      logger.info('🔥 Firebase initialized with ADC (Application Default Credentials)');
      logger.info('   Service account: cloud-run-deployer@involuted-box-469105-r0.iam.gserviceaccount.com');
      firebaseStatus.serviceAccountSource = 'adc';
    }

    firebaseStatus.initialized = true;
    firebaseStatus.error = null;
    initialized = true;
  } catch (error: any) {
    logger.error('❌ Firebase initialization failed:', error?.message || error);
    firebaseStatus.error = error?.message || 'Unknown error';
    initialized = false;
    throw error;
  }
}

export async function ensureFirebaseInitialized(): Promise<void> {
  if (initialized || getApps().length > 0) {
    firebaseStatus.initialized = true;
    return;
  }

  if (!initializing) {
    initializing = initializeFirebaseInternal().finally(() => {
      initializing = null;
    });
  }

  await initializing;
}

export function getFirestore() {
  if (!initialized && getApps().length === 0) {
    throw new Error('Firebase not initialized. Call ensureFirebaseInitialized() before accessing Firestore.');
  }
  return getFirestoreAdmin();
}

export { getApps } from 'firebase-admin/app';
