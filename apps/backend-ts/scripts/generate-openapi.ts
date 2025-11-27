import swaggerJsdoc from 'swagger-jsdoc';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'NUZANTARA API',
      version: '5.2.0',
      description: 'Complete API documentation for NUZANTARA platform',
      contact: {
        name: 'Bali Zero',
        email: 'info@balizero.com',
      },
    },
    servers: [
      { url: 'http://localhost:8080', description: 'Development' },
      { url: 'https://nuzantara-rag.fly.dev', description: 'Production' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'zantara-token',
        },
      },
    },
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
  },
  apis: [
    path.join(projectRoot, 'src/handlers/**/*.ts'),
    path.join(projectRoot, 'src/routes/**/*.ts'),
  ],
};

try {
  const specs = swaggerJsdoc(options);
  const outputPath = path.join(projectRoot, 'docs/openapi.json');

  // Ensure docs directory exists
  const docsDir = path.dirname(outputPath);
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(specs, null, 2));
  console.log('✅ OpenAPI spec generated:', outputPath);
} catch (error) {
  console.error('❌ Error generating OpenAPI spec:', error);
  process.exit(1);
}
