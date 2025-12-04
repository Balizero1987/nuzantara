/* eslint-disable @typescript-eslint/no-require-imports */
const { generate } = require('openapi-typescript-codegen');
const path = require('path');
const fs = require('fs');

// Configuration
const OPENAPI_URL = 'http://localhost:8000/api/v1/openapi.json';
const OUTPUT_DIR = path.resolve(__dirname, '../src/lib/api/generated');

async function generateClient() {
    console.log('🚀 Starting API Client Generation...');
    console.log(`📍 Source: ${OPENAPI_URL}`);
    console.log(`📂 Output: ${OUTPUT_DIR}`);

    try {
        // Ensure output directory exists
        if (!fs.existsSync(OUTPUT_DIR)) {
            fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        }

        await generate({
            input: OPENAPI_URL,
            output: OUTPUT_DIR,
            clientName: 'NuzantaraClient',
            useOptions: true,
            useUnionTypes: true,
            exportCore: true,
            exportServices: true,
            exportModels: true,
            exportSchemas: true,
        });

        console.log('✅ Client generated successfully!');
    } catch (error) {
        console.error('❌ Error generating client:', error);
        console.error('💡 Hint: Is the backend running at http://localhost:8000?');
        process.exit(1);
    }
}

generateClient();
