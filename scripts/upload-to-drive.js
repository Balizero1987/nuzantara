/**
 * Script per caricare l'archivio del codice essenziale su Google Drive
 * Usa l'API del backend TypeScript per l'upload
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const DRIVE_FOLDER_ID = '1jAGhx7MjWtT0u3vfMRga2sTreV3815ZC';
const BACKEND_URL = process.env.BACKEND_URL || 'https://nuzantara-backend.fly.dev';
const API_KEY = process.env.API_KEY || process.env.ZANTARA_API_KEY;

// Trova l'ultimo archivio ZIP creato
function findLatestArchive() {
    const projectRoot = path.join(__dirname, '..');
    const files = fs.readdirSync(projectRoot)
        .filter(f => f.startsWith('zantara-essential-code-') && f.endsWith('.zip'))
        .map(f => ({
            name: f,
            path: path.join(projectRoot, f),
            time: fs.statSync(path.join(projectRoot, f)).mtime
        }))
        .sort((a, b) => b.time - a.time);
    
    return files[0];
}

async function uploadToDrive(filePath, fileName) {
    return new Promise((resolve, reject) => {
        const fileContent = fs.readFileSync(filePath);
        const base64Content = fileContent.toString('base64');
        
        const requestBody = {
            name: fileName,
            parents: [DRIVE_FOLDER_ID],
            content: base64Content,
            mimeType: 'application/zip'
        };

        const postData = JSON.stringify({
            key: 'drive.upload',
            params: requestBody
        });

        const options = {
            hostname: new URL(BACKEND_URL).hostname,
            port: 443,
            path: '/call',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                ...(API_KEY ? { 'x-api-key': API_KEY } : {})
            }
        };

        console.log(`📤 Caricamento ${fileName} su Google Drive...`);
        console.log(`📍 Folder ID: ${DRIVE_FOLDER_ID}`);
        console.log(`🔗 Backend: ${BACKEND_URL}`);

        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    if (response.ok || response.data) {
                        console.log('✅ Upload completato!');
                        console.log(`🔗 Link: ${response.data?.file?.webViewLink || 'N/A'}`);
                        resolve(response);
                    } else {
                        console.error('❌ Errore upload:', response);
                        reject(new Error(response.error || 'Upload failed'));
                    }
                } catch (e) {
                    console.error('❌ Errore parsing risposta:', e);
                    console.error('📄 Risposta raw:', data);
                    reject(e);
                }
            });
        });

        req.on('error', (error) => {
            console.error('❌ Errore richiesta:', error);
            reject(error);
        });

        req.write(postData);
        req.end();
    });
}

// Main
async function main() {
    try {
        const archive = findLatestArchive();
        if (!archive) {
            console.error('❌ Nessun archivio trovato!');
            console.log('💡 Esegui prima: ./scripts/backup-essential-code.sh');
            process.exit(1);
        }

        console.log(`📦 Archivio trovato: ${archive.name}`);
        console.log(`📊 Dimensione: ${(fs.statSync(archive.path).size / 1024 / 1024).toFixed(2)} MB`);

        await uploadToDrive(archive.path, archive.name);
        console.log('✅ Completato!');
    } catch (error) {
        console.error('❌ Errore:', error.message);
        process.exit(1);
    }
}

main();

