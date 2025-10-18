# 📚 Handler Exports Map - NUZANTARA

> **Auto-generated**: 2025-10-05
> **Purpose**: Complete map of all handler exports for test writing

---

## 🎯 Bali Zero Handlers

**Location**: `src/handlers/bali-zero/`

| File | Export Name | Handler Key |
|------|-------------|-------------|
| `bali-zero-pricing.ts` | `baliZeroPricing` | `pricing.official` |
| `bali-zero-pricing.ts` | `baliZeroQuickPrice` | `pricing.quick` |
| `oracle.ts` | `oracleSimulate` | `oracle.simulate` |
| `oracle.ts` | `oracleAnalyze` | `oracle.analyze` |
| `oracle.ts` | `oraclePredict` | `oracle.predict` |
| `kbli.ts` | `kbliLookup` | `kbli.lookup` |
| `kbli.ts` | `kbliRequirements` | `kbli.requirements` |
| `team.ts` | `teamList` | `team.list` |
| `team.ts` | `teamGet` | `team.get` |
| `team.ts` | `teamDepartments` | `team.departments` |
| `advisory.ts` | `documentPrepare` | `document.prepare` |
| `advisory.ts` | `assistantRoute` | `assistant.route` |

**Import Example**:
```typescript
import { baliZeroPricing, baliZeroQuickPrice } from '../bali-zero-pricing.js';
import { oracleSimulate, oracleAnalyze, oraclePredict } from '../oracle.js';
import { kbliLookup, kbliRequirements } from '../kbli.js';
import { teamList, teamGet, teamDepartments } from '../team.js';
```

---

## 🧠 AI Services Handlers

**Location**: `src/handlers/ai-services/`

| File | Export Name | Handler Key |
|------|-------------|-------------|
| `ai.ts` | `aiChat` | `ai.chat` |
| `ai.ts` | `openaiChat` | `openai.chat` |
| `ai.ts` | `claudeChat` | `claude.chat` |
| `ai.ts` | `geminiChat` | `gemini.chat` |
| `ai.ts` | `cohereChat` | `cohere.chat` |
| `advanced-ai.ts` | `aiAnticipate` | `ai.anticipate` |
| `advanced-ai.ts` | `aiLearn` | `ai.learn` |
| `advanced-ai.ts` | `xaiExplain` | `xai.explain` |
| `creative.ts` | `visionAnalyzeImage` | `vision.analyze` |
| `creative.ts` | `visionExtractDocuments` | `vision.extract` |
| `creative.ts` | `speechTranscribe` | `speech.transcribe` |
| `creative.ts` | `speechSynthesize` | `speech.synthesize` |
| `creative.ts` | `languageAnalyzeSentiment` | `language.sentiment` |
| `creative.ts` | `creativeHandlers` (object) | Multiple |

**Import Example**:
```typescript
import { aiChat, openaiChat, claudeChat } from '../ai.js';
import { aiAnticipate, aiLearn } from '../advanced-ai.js';
import { creativeHandlers } from '../creative.js';
```

---

## 💾 Memory Handlers

**Location**: `src/handlers/memory/`

| File | Export Name | Handler Key |
|------|-------------|-------------|
| `memory-firestore.ts` | `memorySave` | `memory.save` |
| `memory-firestore.ts` | `memoryRetrieve` | `memory.retrieve` |
| `memory-firestore.ts` | `memorySearch` | `memory.search` |
| `memory-firestore.ts` | `memoryList` | `memory.list` |
| `conversation-autosave.ts` | `autoSaveConversation` | (utility) |

**Import Example**:
```typescript
import { memorySave, memoryRetrieve, memorySearch, memoryList } from '../memory-firestore.js';
import { autoSaveConversation } from '../conversation-autosave.js';
```

---

## 🔍 RAG Handlers

**Location**: `src/handlers/rag/`

| File | Export Name | Handler Key |
|------|-------------|-------------|
| `rag.ts` | `ragQuery` | `rag.query` |
| `rag.ts` | `baliZeroChat` | `bali.zero.chat` |
| `rag.ts` | `ragSearch` | `rag.search` |
| `rag.ts` | `ragHealth` | `rag.health` |

**Import Example**:
```typescript
import { ragQuery, baliZeroChat, ragSearch, ragHealth } from '../rag.js';
```

---

## 📧 Google Workspace Handlers

**Location**: `src/handlers/google-workspace/`

| File | Export Name | Handler Key |
|------|-------------|-------------|
| `drive.ts` | `driveUpload` | `drive.upload` |
| `drive.ts` | `driveList` | `drive.list` |
| `drive.ts` | `driveSearch` | `drive.search` |
| `drive.ts` | `driveRead` | `drive.read` |
| `calendar.ts` | `calendarList` | `calendar.list` |
| `calendar.ts` | `calendarCreate` | `calendar.create` |
| `calendar.ts` | `calendarGet` | `calendar.get` |
| `gmail.ts` | `gmailHandlers` (object) | Multiple |
| `sheets.ts` | `sheetsRead` | `sheets.read` |
| `sheets.ts` | `sheetsAppend` | `sheets.append` |
| `sheets.ts` | `sheetsCreate` | `sheets.create` |
| `docs.ts` | `docsCreate` | `docs.create` |
| `docs.ts` | `docsRead` | `docs.read` |
| `docs.ts` | `docsUpdate` | `docs.update` |
| `slides.ts` | `slidesCreate` | `slides.create` |
| `slides.ts` | `slidesRead` | `slides.read` |
| `slides.ts` | `slidesUpdate` | `slides.update` |
| `contacts.ts` | `contactsList` | `contacts.list` |
| `contacts.ts` | `contactsCreate` | `contacts.create` |

**Import Example**:
```typescript
import { driveUpload, driveList, driveSearch, driveRead } from '../drive.js';
import { calendarCreate, calendarList, calendarGet } from '../calendar.js';
import { gmailHandlers } from '../gmail.js';
```

---

## 💬 Communication Handlers

**Location**: `src/handlers/communication/`

| File | Export Name | Handler Key |
|------|-------------|-------------|
| `whatsapp.ts` | `whatsappWebhookVerify` | (webhook) |
| `whatsapp.ts` | `whatsappWebhookReceiver` | (webhook) |
| `whatsapp.ts` | `getGroupAnalytics` | `whatsapp.analytics` |
| `whatsapp.ts` | `sendManualMessage` | `whatsapp.send` |
| `instagram.ts` | `instagramWebhookVerify` | (webhook) |
| `instagram.ts` | `instagramWebhookReceiver` | (webhook) |
| `instagram.ts` | `getInstagramUserAnalytics` | `instagram.analytics` |
| `instagram.ts` | `sendManualInstagramMessage` | `instagram.send` |
| `twilio-whatsapp.ts` | `twilioWhatsappWebhook` | (webhook) |
| `twilio-whatsapp.ts` | `twilioSendWhatsapp` | `twilio.whatsapp.send` |
| `communication.ts` | `slackNotify` | `slack.notify` |
| `communication.ts` | `discordNotify` | `discord.notify` |
| `communication.ts` | `googleChatNotify` | `google.chat.notify` |
| `translate.ts` | `translateText` | `translate.text` |
| `translate.ts` | `translateBatch` | `translate.batch` |
| `translate.ts` | `detectLanguage` | `translate.detect` |
| `translate.ts` | `translateHandlers` (object) | Multiple |

**Import Example**:
```typescript
import { whatsappWebhookVerify, whatsappWebhookReceiver, getGroupAnalytics } from '../whatsapp.js';
import { slackNotify, discordNotify } from '../communication.js';
import { translateHandlers } from '../translate.js';
```

---

## 📊 Analytics Handlers

**Location**: `src/handlers/analytics/`

| File | Export Name | Handler Key |
|------|-------------|-------------|
| `analytics.ts` | `analyticsHandlers` (object) | Multiple |
| `dashboard-analytics.ts` | `dashboardMain` | `dashboard.main` |
| `dashboard-analytics.ts` | `dashboardConversations` | `dashboard.conversations` |
| `dashboard-analytics.ts` | `dashboardServices` | `dashboard.services` |
| `dashboard-analytics.ts` | `dashboardHandlers` | `dashboard.handlers` |
| `dashboard-analytics.ts` | `dashboardHealth` | `dashboard.health` |
| `dashboard-analytics.ts` | `dashboardUsers` | `dashboard.users` |
| `weekly-report.ts` | `generateWeeklyReport` | `report.weekly` |
| `weekly-report.ts` | `scheduleWeeklyReport` | (utility) |
| `weekly-report.ts` | `generateMonthlyReport` | `report.monthly` |
| `weekly-report.ts` | `weeklyReportHandlers` (object) | Multiple |
| `daily-drive-recap.ts` | `updateDailyRecap` | `daily.recap.update` |
| `daily-drive-recap.ts` | `getCurrentDailyRecap` | `daily.recap.get` |

**Import Example**:
```typescript
import { analyticsHandlers } from '../analytics.js';
import { dashboardMain, dashboardConversations } from '../dashboard-analytics.js';
import { weeklyReportHandlers } from '../weekly-report.js';
```

---

## 🌸 ZANTARA Handlers

**Location**: `src/handlers/zantara/`

| File | Export Name | Handler Key |
|------|-------------|-------------|
| `zantara-test.ts` | `zantaraPersonalityProfile` | `zantara.personality` |
| `zantara-test.ts` | `zantaraAttune` | `zantara.attune` |
| `zantara-test.ts` | `zantaraSynergyMap` | `zantara.synergy` |
| `zantara-test.ts` | `zantaraAnticipateNeeds` | `zantara.anticipate` |
| `zantara-test.ts` | `zantaraCommunicationAdapt` | `zantara.communication.adapt` |
| `zantara-v2-simple.ts` | `zantaraEmotionalProfileAdvanced` | `zantara.emotional.advanced` |
| `zantara-v2-simple.ts` | `zantaraConflictPrediction` | `zantara.conflict.predict` |
| `zantara-v2-simple.ts` | `zantaraMultiProjectOrchestration` | `zantara.multiproject` |
| `zantara-v2-simple.ts` | `zantaraClientRelationshipIntelligence` | `zantara.client.intelligence` |
| `zantara-dashboard.ts` | `zantaraDashboardOverview` | `zantara.dashboard` |
| `zantara-dashboard.ts` | `zantaraTeamHealthMonitor` | `zantara.team.health` |
| `zantara-dashboard.ts` | `zantaraPerformanceAnalytics` | `zantara.performance` |

**Import Example**:
```typescript
import { zantaraPersonalityProfile, zantaraAttune } from '../zantara-test.js';
import { zantaraEmotionalProfileAdvanced } from '../zantara-v2-simple.js';
import { zantaraDashboardOverview } from '../zantara-dashboard.js';
```

---

## 🗺️ Maps Handlers

**Location**: `src/handlers/maps/`

| File | Export Name | Handler Key |
|------|-------------|-------------|
| `maps.ts` | `mapsDirections` | `maps.directions` |
| `maps.ts` | `mapsPlaces` | `maps.places` |
| `maps.ts` | `mapsPlaceDetails` | `maps.place.details` |

**Import Example**:
```typescript
import { mapsDirections, mapsPlaces, mapsPlaceDetails } from '../maps.js';
```

---

## 👤 Identity Handlers

**Location**: `src/handlers/identity/`

| File | Export Name | Handler Key |
|------|-------------|-------------|
| `identity.ts` | `identityResolve` | `identity.resolve` |
| `identity.ts` | `onboardingStart` | `onboarding.start` |

**Import Example**:
```typescript
import { identityResolve, onboardingStart } from '../identity.js';
```

---

## 🔧 Admin Handlers

**Location**: `src/handlers/admin/`

| File | Export Name | Handler Key |
|------|-------------|-------------|
| `registry-admin.ts` | `listAllHandlers` | `admin.handlers.list` |
| `registry-admin.ts` | `getHandlerStats` | `admin.handlers.stats` |
| `websocket-admin.ts` | `websocketStats` | `websocket.stats` |
| `websocket-admin.ts` | `websocketBroadcast` | `websocket.broadcast` |
| `websocket-admin.ts` | `websocketSendToUser` | `websocket.send` |

---

## 📊 Summary

| Category | Files | Handlers | Status |
|----------|-------|----------|--------|
| **Bali Zero** | 5 | 12 | ✅ Complete |
| **AI Services** | 3 | 13+ | ✅ Complete |
| **Memory** | 2 | 4 | ✅ Complete |
| **RAG** | 1 | 4 | ✅ Complete |
| **Google Workspace** | 8 | 18 | ✅ Complete |
| **Communication** | 5 | 14+ | ✅ Complete |
| **Analytics** | 4 | 12+ | ✅ Complete |
| **ZANTARA** | 3 | 12+ | ✅ Complete |
| **Maps** | 1 | 3 | ✅ Complete |
| **Identity** | 1 | 2 | ✅ Complete |
| **Admin** | 2 | 5 | ✅ Complete |
| **TOTAL** | **35** | **~100+** | ✅ All Extracted |

---

## 🎯 Usage in Tests

### **Correct Import Pattern**

```typescript
// ✅ CORRECT
import { baliZeroPricing } from '../../src/handlers/bali-zero/bali-zero-pricing.js';

describe('Bali Zero Pricing', () => {
  it('should return official prices', async () => {
    const result = await baliZeroPricing({ service_type: 'visa' });
    expect(result.ok).toBe(true);
  });
});
```

### **Incorrect Import Pattern**

```typescript
// ❌ WRONG
import { pricingOfficialHandler } from '../pricing.js';
// File doesn't exist! Should be 'bali-zero-pricing.js'
// Function name is 'baliZeroPricing', not 'pricingOfficialHandler'
```

---

## 🔄 Maintenance

**When adding new handlers**:
1. Update this map with new export name
2. Update tests to use correct import
3. Verify handler key matches router.ts

**Last Updated**: 2025-10-05
