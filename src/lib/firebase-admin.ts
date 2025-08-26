
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import type { ServiceAccount } from 'firebase-admin';
import fs from 'fs';
import path from 'path';

let app: App;

/**
 * Initializes the Firebase Admin SDK if it hasn't been already.
 */
function readServiceAccountFromEnv(): ServiceAccount | null {
    const explicitClientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const explicitPrivateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
    const explicitPrivateKeyB64 = process.env.FIREBASE_PRIVATE_KEY_B64;
    const serviceAccountJsonInline = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.GOOGLE_APPLICATION_CREDENTIALS;

    // Prefer file path or inline JSON to avoid PEM escape issues
    if (serviceAccountPath) {
        try {
            const filePath = path.isAbsolute(serviceAccountPath)
                ? serviceAccountPath
                : path.join(process.cwd(), serviceAccountPath);
            const contents = fs.readFileSync(filePath, 'utf8');
            const json = JSON.parse(contents);
            return {
                projectId: json.project_id,
                clientEmail: json.client_email,
                privateKey: json.private_key,
            };
        } catch (error) {
            console.error('Failed to read service account from path:', error);
        }
    }

    if (serviceAccountJsonInline) {
        try {
            const json = JSON.parse(serviceAccountJsonInline);
            return {
                projectId: json.project_id,
                clientEmail: json.client_email,
                privateKey: json.private_key,
            };
        } catch (error) {
            console.error('Failed to parse inline service account JSON:', error);
        }
    }

    // Fallback: service-account.json in project root (no env needed)
    try {
        const defaultPath = path.join(process.cwd(), 'service-account.json');
        if (fs.existsSync(defaultPath)) {
            const contents = fs.readFileSync(defaultPath, 'utf8');
            const json = JSON.parse(contents);
            return {
                projectId: json.project_id,
                clientEmail: json.client_email,
                privateKey: json.private_key,
            };
        }
    } catch (error) {
        console.error('Failed to read default service-account.json:', error);
    }

    if (explicitClientEmail && (explicitPrivateKeyRaw || explicitPrivateKeyB64)) {
        let privateKey = explicitPrivateKeyRaw || '';
        if (explicitPrivateKeyB64 && !privateKey) {
            privateKey = Buffer.from(explicitPrivateKeyB64 as string, 'base64').toString('utf8');
        }
        // Repair common formatting mistakes: remove surrounding quotes and normalize CRLF
        privateKey = privateKey.trim();
        if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
            privateKey = privateKey.slice(1, -1);
        }
        privateKey = privateKey.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n');

        return {
            projectId: process.env.FIREBASE_PROJECT_ID || 'eduverse-98jdv',
            clientEmail: explicitClientEmail,
            privateKey,
        };
    }

    return null;
}

export function initAdmin() {
    if (getApps().length > 0) {
        app = getApps()[0];
        return;
    }

    const fallbackProjectId = 'eduverse-98jdv';
    const serviceAccount = readServiceAccountFromEnv();

    if (!serviceAccount) {
        throw new Error(
            'Failed to initialize Firebase Admin SDK. Missing credentials. Set one of:\n' +
            ' - FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY (escape newlines as \\n), or\n' +
            ' - FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY_B64 (base64 of the full key), or\n' +
            ' - FIREBASE_SERVICE_ACCOUNT_JSON (stringified JSON), or\n' +
            ' - FIREBASE_SERVICE_ACCOUNT/GOOGLE_APPLICATION_CREDENTIALS (path to JSON file).'
        );
    }

    // Ensure projectId fallback if not present
    if (!serviceAccount.projectId) {
        serviceAccount.projectId = process.env.FIREBASE_PROJECT_ID || fallbackProjectId;
    }

    // Normalize PEM formatting to avoid Invalid PEM errors
    const normalizePem = (key: string): string => {
        if (!key) return key;
        let k = key.trim();
        if ((k.startsWith('"') && k.endsWith('"')) || (k.startsWith("'") && k.endsWith("'"))) {
            k = k.slice(1, -1);
        }
        // Convert common escaped sequences to real newlines
        k = k.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n').replace(/\r\n/g, '\n');
        // Ensure header/footer have their own lines
        k = k.replace(/-----BEGIN PRIVATE KEY-----\s*/g, '-----BEGIN PRIVATE KEY-----\n')
             .replace(/\s*-----END PRIVATE KEY-----/g, '\n-----END PRIVATE KEY-----\n');
        return k;
    };
    
    // Additional normalization for environment variable private keys
    if (serviceAccount.privateKey) {
        serviceAccount.privateKey = normalizePem(serviceAccount.privateKey as string);
        // Handle the specific case where newlines are escaped as literal \n
        if (serviceAccount.privateKey.includes('\\n')) {
            serviceAccount.privateKey = serviceAccount.privateKey.replace(/\\n/g, '\n');
        }
    }

    try {
        console.log('Initializing Firebase Admin SDK with project:', serviceAccount.projectId);
        app = initializeApp({
            credential: cert(serviceAccount),
            storageBucket: `${serviceAccount.projectId}.appspot.com`,
        });
        console.log('Firebase Admin SDK initialized successfully');
    } catch (error: any) {
        console.error('Firebase Admin SDK initialization failed:', error);
        throw new Error(`Failed to initialize Firebase Admin SDK. Error: ${error.message}`);
    }
}

/**
 * Returns the initialized Firebase Admin services with timeout handling.
 * This is the ONLY way to access admin services.
 */
export const getAdminServices = () => {
  if (!app) {
    initAdmin();
  }
  
  const services = { 
    auth: getAuth(app),
    db: getFirestore(app),
    storage: getStorage(app),
  };

  // Remove timeout handling to prevent issues
  // const originalGet = services.db.collection;
  // services.db.collection = function(collectionPath: string) {
  //   const collection = originalGet.call(this, collectionPath);
    
  //   // Add timeout to get() operations
  //   const originalCollectionGet = collection.get;
  //   collection.get = function(options?: any) {
  //     const timeoutPromise = new Promise((_, reject) => {
  //       setTimeout(() => reject(new Error('Database operation timed out after 30 seconds')), 30000);
  //     });
      
  //     return Promise.race([
  //       originalCollectionGet.call(this, options),
  //       timeoutPromise
  //     ]);
  //   };
    
  //   return collection;
  // };

  return services;
};
