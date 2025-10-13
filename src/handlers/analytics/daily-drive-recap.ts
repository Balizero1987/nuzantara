// Daily Drive Recap System for ZANTARA v5.2.0
// Mantiene file giornalieri aggiornati per ogni collaboratore
import logger from '../services/logger.js';
import { z } from "zod";
import { ok } from "../../utils/response.js";
import { getDrive } from "../../services/google-auth-service.js";

const DailyRecapSchema = z.object({
  collaboratorId: z.string().min(1),
  activityType: z.enum(['chat', 'search', 'task', 'memory', 'general']),
  content: z.string().min(1),
  timestamp: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

// Collaboratori attivi con info per Drive
const COLLABORATORS = {
  zero: { name: "Zero", role: "Tech Lead", folderId: "1cR2BRhVx0fODIQxdLfRhQV_xJ9R9kWb5" },
  zainal: { name: "Zainal", role: "CEO", folderId: "1cR2BRhVx0fODIQxdLfRhQV_xJ9R9kWb5" },
  amanda: { name: "Amanda", role: "Lead Executive", folderId: "1cR2BRhVx0fODIQxdLfRhQV_xJ9R9kWb5" },
  anton: { name: "Anton", role: "Lead Executive", folderId: "1cR2BRhVx0fODIQxdLfRhQV_xJ9R9kWb5" },
  krisna: { name: "Krisna", role: "Lead Executive", folderId: "1cR2BRhVx0fODIQxdLfRhQV_xJ9R9kWb5" },
  dea: { name: "Dea", role: "Lead Executive", folderId: "1cR2BRhVx0fODIQxdLfRhQV_xJ9R9kWb5" },
  adit: { name: "Adit", role: "Lead Supervisor", folderId: "1cR2BRhVx0fODIQxdLfRhQV_xJ9R9kWb5" },
  veronika: { name: "Veronika", role: "Tax Manager", folderId: "1cR2BRhVx0fODIQxdLfRhQV_xJ9R9kWb5" },
  angel: { name: "Angel", role: "Tax Expert", folderId: "1cR2BRhVx0fODIQxdLfRhQV_xJ9R9kWb5" },
  sahira: { name: "Sahira", role: "Marketing", folderId: "1cR2BRhVx0fODIQxdLfRhQV_xJ9R9kWb5" }
};

// Cache dei file giornalieri per evitare ricerche multiple
const dailyFileCache = new Map<string, { fileId: string, content: string, lastUpdate: number }>();

// Initialize Google Drive using centralized service
async function initDrive() {
  return getDrive();
}

// Genera nome file giornaliero
function getDailyFileName(collaboratorId: string, date: Date = new Date()): string {
  const dateStr = date.toISOString().split('T')[0]; // 2025-09-26
  const collaborator = COLLABORATORS[collaboratorId as keyof typeof COLLABORATORS];
  return `${collaborator?.name || collaboratorId}_DAILY_${dateStr}.txt`;
}

// Cerca file giornaliero esistente
async function findDailyFile(drive: any, collaboratorId: string, date: Date = new Date()): Promise<string | null> {
  const fileName = getDailyFileName(collaboratorId, date);
  const cacheKey = `${collaboratorId}_${date.toISOString().split('T')[0]}`;

  // Check cache first
  const cached = dailyFileCache.get(cacheKey);
  if (cached && Date.now() - cached.lastUpdate < 300000) { // 5 min cache
    return cached.fileId;
  }

  try {
    const collaborator = COLLABORATORS[collaboratorId as keyof typeof COLLABORATORS];
    if (!collaborator) return null;

    const response = await drive.files.list({
      q: `name='${fileName}' and parents in '${collaborator.folderId}' and trashed=false`,
      fields: 'files(id, name)'
    });

    if (response.data.files && response.data.files.length > 0) {
      const fileId = response.data.files[0].id;
      logger.info(`📁 Found existing daily file: ${fileName} (${fileId})`);
      return fileId;
    }

    return null;
  } catch (error: any) {
    logger.error('❌ Error searching daily file:', error.message);
    return null;
  }
}

// Legge contenuto file esistente
async function readDailyFileContent(drive: any, fileId: string): Promise<string> {
  try {
    const response = await drive.files.get({
      fileId,
      alt: 'media'
    });

    return response.data || '';
  } catch (error: any) {
    logger.error('❌ Error reading daily file:', error.message);
    return '';
  }
}

// Crea template iniziale file giornaliero
function createDailyTemplate(collaboratorId: string, date: Date = new Date()): string {
  const collaborator = COLLABORATORS[collaboratorId as keyof typeof COLLABORATORS];
  const dateStr = date.toLocaleDateString('it-IT', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
🗓️ ZANTARA DAILY RECAP - ${dateStr}
==================================================
👤 Collaboratore: ${collaborator?.name || collaboratorId} (${collaborator?.role || 'Team Member'})
🕐 Creato: ${new Date().toLocaleString('it-IT', { timeZone: 'Asia/Makassar' })}

📋 SOMMARIO GIORNATA
==================
- Chat: 0 conversazioni
- Ricerche: 0 query
- Attività: 0 task
- Memoria: 0 salvataggi

🗨️ CONVERSAZIONI CHAT
====================
(Nessuna conversazione registrata)

🔍 RICERCHE & QUERY
==================
(Nessuna ricerca registrata)

⚡ ATTIVITÀ & TASK
=================
(Nessuna attività registrata)

🧠 MEMORIE SALVATE
==================
(Nessuna memoria registrata)

📈 INSIGHTS GIORNALIERI
======================
File creato automaticamente da ZANTARA v5.2.0
Ultimo aggiornamento: ${new Date().toLocaleString('it-IT', { timeZone: 'Asia/Makassar' })}

==================================================
`;
}

// Aggiorna contatori nel sommario
function updateSummaryCounters(content: string, activityType: string): string {
  const lines = content.split('\n');
  let inSummary = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    if (line.includes('📋 SOMMARIO GIORNATA')) {
      inSummary = true;
      continue;
    }

    if (inSummary && line.includes('🗨️ CONVERSAZIONI CHAT')) {
      inSummary = false;
      break;
    }

    if (inSummary && line.includes('- Chat:') && activityType === 'chat') {
      const match = line.match(/- Chat: (\d+)/);
      const count = match?.[1] ? parseInt(match[1]) + 1 : 1;
      lines[i] = `- Chat: ${count} conversazioni`;
    }

    if (inSummary && line.includes('- Ricerche:') && activityType === 'search') {
      const match = line.match(/- Ricerche: (\d+)/);
      const count = match?.[1] ? parseInt(match[1]) + 1 : 1;
      lines[i] = `- Ricerche: ${count} query`;
    }

    if (inSummary && line.includes('- Attività:') && activityType === 'task') {
      const match = line.match(/- Attività: (\d+)/);
      const count = match?.[1] ? parseInt(match[1]) + 1 : 1;
      lines[i] = `- Attività: ${count} task`;
    }

    if (inSummary && line.includes('- Memoria:') && activityType === 'memory') {
      const match = line.match(/- Memoria: (\d+)/);
      const count = match?.[1] ? parseInt(match[1]) + 1 : 1;
      lines[i] = `- Memoria: ${count} salvataggi`;
    }
  }

  return lines.join('\n');
}

// Aggiunge nuova attività alla sezione appropriata
function addActivityToSection(content: string, activityType: string, activityContent: string, timestamp: string): string {
  const lines = content.split('\n');
  const timeStr = new Date(timestamp || Date.now()).toLocaleTimeString('it-IT', {
    timeZone: 'Asia/Makassar',
    hour: '2-digit',
    minute: '2-digit'
  });

  let sectionFound = false;
  let insertIndex = -1;

  // Trova la sezione appropriata
  const sectionHeaders = {
    chat: '🗨️ CONVERSAZIONI CHAT',
    search: '🔍 RICERCHE & QUERY',
    task: '⚡ ATTIVITÀ & TASK',
    memory: '🧠 MEMORIE SALVATE'
  };

  const targetHeader = sectionHeaders[activityType as keyof typeof sectionHeaders];
  if (!targetHeader) return content;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    if (line.includes(targetHeader)) {
      sectionFound = true;
      // Trova il posto per inserire (prima della prossima sezione)
      for (let j = i + 1; j < lines.length; j++) {
        const nextLine = lines[j];
        if (!nextLine) continue;

        if (nextLine.includes('📈 INSIGHTS GIORNALIERI') ||
            nextLine.includes('🗨️ CONVERSAZIONI CHAT') ||
            nextLine.includes('🔍 RICERCHE & QUERY') ||
            nextLine.includes('⚡ ATTIVITÀ & TASK') ||
            nextLine.includes('🧠 MEMORIE SALVATE')) {
          insertIndex = j;
          break;
        }
      }
      break;
    }
  }

  if (sectionFound && insertIndex > 0) {
    // Rimuovi placeholder se presente
    const placeholderIndex = lines.findIndex((line, idx) =>
      idx > insertIndex - 10 && idx < insertIndex &&
      (line.includes('(Nessuna conversazione registrata)') ||
       line.includes('(Nessuna ricerca registrata)') ||
       line.includes('(Nessuna attività registrata)') ||
       line.includes('(Nessuna memoria registrata)'))
    );

    if (placeholderIndex > 0) {
      lines.splice(placeholderIndex, 1);
      insertIndex--;
    }

    // Aggiungi nuova entry
    const entry = `${timeStr} | ${activityContent}`;
    lines.splice(insertIndex, 0, entry, '');
  }

  // Aggiorna timestamp ultimo aggiornamento
  const lastUpdateIndex = lines.findIndex(line => line.includes('Ultimo aggiornamento:'));
  if (lastUpdateIndex > 0) {
    lines[lastUpdateIndex] = `Ultimo aggiornamento: ${new Date().toLocaleString('it-IT', { timeZone: 'Asia/Makassar' })}`;
  }

  return lines.join('\n');
}

// Crea o aggiorna file giornaliero
async function createOrUpdateDailyFile(drive: any, collaboratorId: string, content: string): Promise<string | null> {
  const collaborator = COLLABORATORS[collaboratorId as keyof typeof COLLABORATORS];
  if (!collaborator) return null;

  const fileName = getDailyFileName(collaboratorId);
  const existingFileId = await findDailyFile(drive, collaboratorId);

  try {
    if (existingFileId) {
      // Update existing file
      await drive.files.update({
        fileId: existingFileId,
        media: {
          mimeType: 'text/plain',
          body: content
        }
      });

      logger.info(`✅ Updated daily file for ${collaborator.name}: ${fileName}`);
      return existingFileId;
    } else {
      // Create new file
      const fileMetadata = {
        name: fileName,
        parents: [collaborator.folderId],
        description: `Daily recap for ${collaborator.name} - ${new Date().toISOString().split('T')[0]}`
      };

      const response = await drive.files.create({
        requestBody: fileMetadata,
        media: {
          mimeType: 'text/plain',
          body: content
        },
        fields: 'id, name'
      });

      logger.info(`✅ Created daily file for ${collaborator.name}: ${fileName} (${response.data.id})`);
      return response.data.id;
    }
  } catch (error: any) {
    logger.error('❌ Error creating/updating daily file:', error.message);
    return null;
  }
}

// Handler principale per aggiornamento recap giornaliero
export async function updateDailyRecap(params: any) {
  const p = DailyRecapSchema.parse(params);

  try {
    // Check if collaborator exists
    if (!COLLABORATORS[p.collaboratorId as keyof typeof COLLABORATORS]) {
      return ok({
        updated: false,
        reason: `Collaborator ${p.collaboratorId} not found in system`,
        available_collaborators: Object.keys(COLLABORATORS)
      });
    }

    const drive = await initDrive();
    const existingFileId = await findDailyFile(drive, p.collaboratorId);

    let currentContent = '';

    if (existingFileId) {
      currentContent = await readDailyFileContent(drive, existingFileId);
    } else {
      currentContent = createDailyTemplate(p.collaboratorId);
    }

    // Update counters in summary
    const updatedContent = updateSummaryCounters(currentContent, p.activityType);

    // Add activity to appropriate section
    const finalContent = addActivityToSection(
      updatedContent,
      p.activityType,
      p.content,
      p.timestamp || new Date().toISOString()
    );

    // Create or update file
    const fileId = await createOrUpdateDailyFile(drive, p.collaboratorId, finalContent);

    if (fileId) {
      // Update cache
      const cacheKey = `${p.collaboratorId}_${new Date().toISOString().split('T')[0]}`;
      dailyFileCache.set(cacheKey, {
        fileId,
        content: finalContent,
        lastUpdate: Date.now()
      });

      return ok({
        updated: true,
        collaborator: COLLABORATORS[p.collaboratorId as keyof typeof COLLABORATORS],
        activity: {
          type: p.activityType,
          content: p.content,
          timestamp: p.timestamp || new Date().toISOString()
        },
        file: {
          id: fileId,
          name: getDailyFileName(p.collaboratorId)
        }
      });
    } else {
      return ok({
        updated: false,
        reason: 'Failed to create or update daily file',
        error: 'Drive operation failed'
      });
    }

  } catch (error: any) {
    logger.error('❌ Daily recap update error:', error.message);
    return ok({
      updated: false,
      reason: 'System error during daily recap update',
      error: error.message
    });
  }
}

// Helper per ottenere recap corrente
export async function getCurrentDailyRecap(params: any) {
  const { collaboratorId } = params;

  if (!collaboratorId || !COLLABORATORS[collaboratorId as keyof typeof COLLABORATORS]) {
    return ok({
      found: false,
      reason: 'Collaborator not found',
      available_collaborators: Object.keys(COLLABORATORS)
    });
  }

  try {
    const drive = await initDrive();
    const existingFileId = await findDailyFile(drive, collaboratorId);

    if (existingFileId) {
      const content = await readDailyFileContent(drive, existingFileId);
      return ok({
        found: true,
        collaborator: COLLABORATORS[collaboratorId as keyof typeof COLLABORATORS],
        file: {
          id: existingFileId,
          name: getDailyFileName(collaboratorId),
          content: content.substring(0, 1000) + '...' // First 1000 chars for preview
        },
        today: new Date().toISOString().split('T')[0]
      });
    } else {
      return ok({
        found: false,
        reason: 'No daily file found for today',
        collaborator: COLLABORATORS[collaboratorId as keyof typeof COLLABORATORS],
        suggested_action: 'File will be created on first activity'
      });
    }
  } catch (error: any) {
    return ok({
      found: false,
      reason: 'Error accessing daily file',
      error: error.message
    });
  }
}