// Conversation Auto-Save System for ZANTARA v5.2.0
// Automatically saves all conversations with Zero and collaborators
import { ok, err } from "../../utils/response.js";
import { BadRequestError } from "../../utils/errors.js";
import { memorySave } from "./memory-firestore.js";
import { updateDailyRecap } from "../analytics/daily-drive-recap.js";
// Removed googleapis imports - using existing drive.upload handler instead

// Collaborator identification patterns
const COLLABORATOR_PATTERNS = {
  zero: ['zero', 'antonello', 'boss', 'ceo'],
  team: {
    zainal: ['zainal', 'zay', 'operation'],
    setup: ['setup team', 'visa team', 'immigration'],
    tax: ['tax team', 'pajak', 'accounting'],
    marketing: ['marketing', 'social', 'content'],
    reception: ['reception', 'front desk', 'customer service'],
    board: ['board', 'management', 'directors']
  }
};

// Identify user from headers or context
function identifyUser(req: any): { userId: string, role: string, isZero: boolean } {
  // Check headers for user identification
  const userHeader = req.headers['x-user-id'] ||
                    req.headers['x-collaborator-id'] ||
                    req.headers['x-username'] ||
                    '';

  const userAgent = req.headers['user-agent'] || '';
  const apiKey = req.headers['x-api-key'] || '';

  // Check if it's Zero
  const isZero = COLLABORATOR_PATTERNS.zero.some(pattern =>
    userHeader.toLowerCase().includes(pattern) ||
    userAgent.toLowerCase().includes(pattern)
  );

  if (isZero) {
    return { userId: 'zero', role: 'owner', isZero: true };
  }

  // Check for team members
  for (const [teamMember, patterns] of Object.entries(COLLABORATOR_PATTERNS.team)) {
    const isTeamMember = patterns.some(pattern =>
      userHeader.toLowerCase().includes(pattern)
    );
    if (isTeamMember) {
      return { userId: teamMember, role: 'team', isZero: false };
    }
  }

  // Default to anonymous with timestamp
  return {
    userId: `user_${Date.now()}`,
    role: 'anonymous',
    isZero: false
  };
}

// Save to Firestore via memory system
async function saveToFirestore(conversationData: any) {
  try {
    // Use the existing memory system which handles Firestore
    const memoryData = {
      userId: conversationData.userId,
      type: 'conversation_log',
      data: conversationData,
      key: `conv_${conversationData.handler}`,
      value: JSON.stringify({
        prompt: conversationData.prompt.substring(0, 1000),
        response: conversationData.response.substring(0, 1000),
        metadata: conversationData.metadata
      })
    };

    // This will save to Firestore through the existing memory system
    const result = await memorySave(memoryData);

    return {
      success: result.ok || false,
      docId: `conv_${Date.now()}`
    };
  } catch (error: any) {
    console.error('🔥 Firestore save failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Save to Google Drive as backup using the working drive.upload handler
async function saveToDrive(conversationData: any) {
  try {
    // Import the working drive upload handler
    const { driveUpload } = await import('../google-workspace/drive.ts');

    // Format conversation as readable text
    const conversationText = `
ZANTARA CONVERSATION LOG
========================
Date: ${conversationData.timestamp}
User: ${conversationData.userId} (${conversationData.role})
Handler: ${conversationData.handler}

PROMPT:
${conversationData.prompt}

RESPONSE:
${conversationData.response}

METADATA:
- Model: ${conversationData.model || 'unknown'}
- Response Time: ${conversationData.responseTime}ms
- IP: ${conversationData.metadata?.ip || 'unknown'}
- User Agent: ${conversationData.metadata?.userAgent || 'unknown'}
========================
`;

    // Create file name
    const date = new Date();
    const fileName = `zantara_conversation_${conversationData.userId}_${date.toISOString().split('T')[0]}_${Date.now()}.txt`;

    // Use the working drive.upload handler
    const result = await driveUpload({
      name: fileName,
      mimeType: 'text/plain',
      media: {
        body: conversationText
      }
    });

    if (result.ok) {
      return {
        success: true,
        fileId: result.data.file.id,
        fileName: result.data.file.name
      };
    } else {
      throw new Error(result.error || 'Drive upload failed');
    }

  } catch (error: any) {
    console.error('🔥 Drive backup failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Main auto-save function
export async function autoSaveConversation(
  req: any,
  prompt: string,
  response: string,
  handler: string,
  metadata?: any
) {
  try {
    // Identify user
    const { userId, role, isZero } = identifyUser(req);

    console.log(`💾 Auto-saving conversation for ${userId} (${role})`);

    // Prepare conversation data
    const conversationData = {
      userId,
      role,
      isZero,
      handler,
      prompt: prompt.substring(0, 5000), // Limit prompt size
      response: response.substring(0, 10000), // Limit response size
      timestamp: new Date().toISOString(),
      responseTime: metadata?.responseTime || 0,
      model: metadata?.model || 'unknown',
      metadata: {
        ip: req.ip || req.connection?.remoteAddress,
        userAgent: req.headers['user-agent'],
        apiKey: req.headers['x-api-key']?.substring(0, 8) + '...',
        path: req.path,
        method: req.method
      }
    };

    // Save to memory system (local)
    const memoryResult = await memorySave({
      userId,
      type: 'conversation',
      key: `chat_${handler}`,
      value: {
        prompt: prompt.substring(0, 500),
        response: response.substring(0, 500),
        timestamp: conversationData.timestamp
      }
    });

    // Save to Firestore (persistent)
    const firestoreResult = await saveToFirestore(conversationData);

    // Save to Drive if it's Zero or important team member
    let driveResult: any = { success: false, error: 'Not saved to Drive' };
    if (isZero || role === 'team') {
      driveResult = await saveToDrive(conversationData);
    }

    // Update daily recap for collaborator
    let dailyRecapResult: any = { updated: false, error: 'Not a recognized collaborator' };
    if (isZero || role === 'team') {
      try {
        // Create summary for daily recap
        const activitySummary = `Chat ${handler}: ${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}`;

        dailyRecapResult = await updateDailyRecap({
          collaboratorId: userId.toLowerCase(),
          activityType: 'chat',
          content: activitySummary,
          timestamp: conversationData.timestamp,
          metadata: {
            handler,
            responseTime: conversationData.responseTime,
            model: conversationData.model
          }
        });
      } catch (error: any) {
        console.log('⚠️ Daily recap update failed:', error.message);
        dailyRecapResult = { updated: false, error: error.message };
      }
    }

    // Log results
    console.log('💾 Auto-save results:', {
      memory: memoryResult.ok ? '✅' : '❌',
      firestore: firestoreResult.success ? '✅' : '❌',
      drive: driveResult.success ? '✅' : '❌',
      dailyRecap: dailyRecapResult.updated ? '✅' : '❌',
      userId,
      role
    });

    return {
      saved: true,
      locations: {
        memory: memoryResult.ok,
        firestore: firestoreResult.success,
        drive: driveResult.success,
        dailyRecap: dailyRecapResult.updated
      },
      user: { userId, role, isZero }
    };

  } catch (error: any) {
    console.error('❌ Auto-save failed:', error.message);
    return {
      saved: false,
      error: error.message
    };
  }
}

// Export for use in router
export const conversationAutoSave = {
  autoSaveConversation
};