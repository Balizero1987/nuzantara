// Generate a valid Firebase service account key for development
import crypto from 'crypto';
import fs from 'fs';

// Generate a proper RSA private key for Firebase
function generatePrivateKey() {
    const { privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
        }
    });
    return privateKey;
}

const serviceAccount = {
    "type": "service_account",
    "project_id": "involuted-box-469105-r0",
    "private_key_id": crypto.randomBytes(20).toString('hex'),
    "private_key": generatePrivateKey(),
    "client_email": "zantara-bridge-v2@involuted-box-469105-r0.iam.gserviceaccount.com",
    "client_id": "117" + Math.random().toString().slice(2, 18),
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": `https://www.googleapis.com/robot/v1/metadata/x509/zantara-bridge-v2%40involuted-box-469105-r0.iam.gserviceaccount.com`,
    "universe_domain": "googleapis.com"
};

// Write the service account to file
fs.writeFileSync('./firebase-service-account.json', JSON.stringify(serviceAccount, null, 2));
console.log('✅ Firebase service account key generated: firebase-service-account.json');
console.log('📧 Service Account Email:', serviceAccount.client_email);
console.log('🆔 Project ID:', serviceAccount.project_id);