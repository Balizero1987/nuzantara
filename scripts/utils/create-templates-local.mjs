#!/usr/bin/env node
// Create Docs/Slides placeholder templates in a Shared Drive via Service Account

import fs from 'fs';
import { google } from 'googleapis';

function getArg(name, def = undefined) {
  const a = process.argv.find(x => x.startsWith(`--${name}=`));
  return a ? a.split('=')[1] : def;
}

const driveId = getArg('driveId') || process.env.GDRIVE_AMBARADAM_DRIVE_ID || process.env.DRIVE_FOLDER_ID;
const docTitle = getArg('docTitle') || 'ZANTARA Proposal Template';
const slidesTitle = getArg('slidesTitle') || 'ZANTARA Kickoff Template';

if (!driveId) {
  console.error('❌ driveId is required (or set GDRIVE_AMBARADAM_DRIVE_ID)');
  process.exit(1);
}

async function getJwtAuth() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  const file = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  let sa;
  if (raw) sa = JSON.parse(raw);
  else if (file) sa = JSON.parse(fs.readFileSync(file, 'utf8'));
  else throw new Error('No Service Account: set GOOGLE_SERVICE_ACCOUNT_KEY or GOOGLE_APPLICATION_CREDENTIALS');
  if (!sa.client_email || !sa.private_key) throw new Error('Service account missing client_email/private_key');
  const subject = process.env.IMPERSONATE_USER || undefined;
  return new google.auth.JWT({
    email: sa.client_email,
    key: sa.private_key,
    scopes: [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/documents',
      'https://www.googleapis.com/auth/presentations'
    ],
    subject
  });
}

async function main() {
  console.log('🔐 Authenticating with Service Account...');
  const auth = await getJwtAuth();
  const drive = google.drive({ version: 'v3', auth });
  const docs = google.docs({ version: 'v1', auth });
  const slides = google.slides({ version: 'v1', auth });

  console.log('📄 Creating Docs template in drive:', driveId);
  const docMeta = await drive.files.create({
    requestBody: { name: docTitle, mimeType: 'application/vnd.google-apps.document', parents: [driveId] },
    supportsAllDrives: true,
    fields: 'id,name,webViewLink,parents'
  });
  const documentId = docMeta.data.id;

  await docs.documents.batchUpdate({
    documentId,
    requestBody: {
      requests: [{
        insertText: {
          location: { index: 1 },
          text: `Bali Zero – Proposal\n\nClient: {{CLIENT_NAME}}\nService: {{SERVICE}}\nPrice: {{PRICE}} {{CURRENCY}}\nTimeline: {{TIMELINE}}\nDate: {{DATE}}\n\nContact WhatsApp: {{CONTACT_WHATSAPP}}\nContact Email: {{CONTACT_EMAIL}}\n\nNotes:\n- ...\n- ...\n`
        }
      }]
    }
  });

  console.log('🎞️ Creating Slides template in drive:', driveId);
  const slidesMeta = await drive.files.create({
    requestBody: { name: slidesTitle, mimeType: 'application/vnd.google-apps.presentation', parents: [driveId] },
    supportsAllDrives: true,
    fields: 'id,name,webViewLink,parents'
  });
  const presentationId = slidesMeta.data.id;

  await slides.presentations.batchUpdate({
    presentationId,
    requestBody: {
      requests: [
        { createSlide: { slideLayoutReference: { predefinedLayout: 'BLANK' } } },
        { createShape: { objectId: 'shape_1', shapeType: 'TEXT_BOX' } },
        { insertText: { objectId: 'shape_1', text: 'Kickoff – {{PROJECT}}\nClient: {{CLIENT_NAME}}\nDate: {{DATE}}' } }
      ]
    }
  });

  const result = {
    ok: true,
    data: {
      doc: { id: documentId, url: `https://docs.google.com/document/d/${documentId}/edit` },
      slides: { id: presentationId, url: `https://docs.google.com/presentation/d/${presentationId}/edit` },
      driveId
    }
  };

  console.log(JSON.stringify(result, null, 2));
}

main().catch(err => {
  console.error('❌ Failed to create templates:', err?.message || err);
  process.exit(1);
});

