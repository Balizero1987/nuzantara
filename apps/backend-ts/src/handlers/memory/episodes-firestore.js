// Episodic Memory Handlers for ZANTARA v5.2.0
// Time-indexed events with entity tracking
import logger from '../../services/logger.js';
import { ok } from "../../utils/response.js";
import { BadRequestError } from "../../utils/errors.js";
import { getFirestore } from "../../services/firebase.js";
// Known entities (same as memory-firestore.ts)
const KNOWN_ENTITIES = {
    people: ['zero', 'antonello', 'zainal', 'ruslana', 'amanda', 'anton', 'krisna', 'dea', 'adit', 'vino', 'ari', 'surya', 'damar', 'veronika', 'angel', 'kadek', 'dewaayu', 'faisha', 'sahira', 'nina', 'rina', 'marta', 'olena'],
    projects: ['zantara', 'nuzantara', 'google_workspace', 'rag', 'chromadb', 'pricing', 'pt_pma', 'kitas', 'kitap', 'visa', 'tax'],
    skills: ['typescript', 'python', 'tax', 'pph', 'ppn', 'kitas', 'e28a', 'e23', 'e33', 'pt_pma', 'bkpm', 'legal', 'compliance', 'cloud_run', 'firestore', 'ai'],
    companies: ['bali_zero', 'balizero']
};
/**
 * Extract entities from text (same logic as memory-firestore)
 */
function extractEntities(text, contextUserId) {
    const entities = [];
    const lowerText = text.toLowerCase();
    for (const [category, items] of Object.entries(KNOWN_ENTITIES)) {
        for (const entity of items) {
            if (lowerText.includes(entity.toLowerCase())) {
                entities.push(`${category}:${entity}`);
            }
        }
    }
    if (contextUserId && !entities.some(e => e.includes(contextUserId))) {
        entities.push(`people:${contextUserId}`);
    }
    return [...new Set(entities)];
}
// Firestore episode store
class FirestoreEpisodeStore {
    db = null;
    fallbackStore = new Map();
    constructor() {
        try {
            this.db = getFirestore();
            logger.info('✅ Firestore episode store initialized');
        }
        catch (error) {
            logger.info('⚠️ Firestore not available, using in-memory fallback:', error?.message);
        }
    }
    async saveEpisode(params) {
        const { userId, event, type = 'general', metadata = {}, timestamp } = params;
        if (!userId || !event)
            return null;
        const eventTimestamp = timestamp ? new Date(timestamp) : new Date();
        const entities = extractEntities(event, userId);
        const eventId = `evt_${Date.now()}`;
        const episodeData = {
            id: eventId,
            userId,
            timestamp: eventTimestamp,
            event,
            entities,
            type,
            metadata,
            created_at: new Date()
        };
        try {
            if (this.db) {
                await this.db
                    .collection('episodes')
                    .doc(userId)
                    .collection('events')
                    .doc(eventId)
                    .set(episodeData);
                logger.info(`✅ Episode saved: ${eventId} for ${userId}`);
                return episodeData;
            }
        }
        catch (error) {
            logger.info('⚠️ Firestore episode write error, using fallback:', error?.message);
        }
        // Fallback
        const userEvents = this.fallbackStore.get(userId) || [];
        userEvents.push(episodeData);
        this.fallbackStore.set(userId, userEvents);
        return episodeData;
    }
    async getTimeline(userId, startDate, endDate, limit = 50) {
        const episodes = [];
        try {
            if (this.db) {
                let query = this.db
                    .collection('episodes')
                    .doc(userId)
                    .collection('events')
                    .orderBy('timestamp', 'desc');
                if (startDate) {
                    query = query.where('timestamp', '>=', startDate);
                }
                if (endDate) {
                    query = query.where('timestamp', '<=', endDate);
                }
                const snapshot = await query.limit(limit).get();
                snapshot.forEach(doc => {
                    const data = doc.data();
                    episodes.push({
                        id: data.id,
                        userId: data.userId,
                        timestamp: data.timestamp,
                        event: data.event,
                        entities: data.entities || [],
                        type: data.type,
                        metadata: data.metadata || {}
                    });
                });
                return episodes;
            }
        }
        catch (error) {
            logger.info('⚠️ Firestore timeline read error, using fallback:', error?.message);
        }
        // Fallback
        let userEvents = this.fallbackStore.get(userId) || [];
        if (startDate) {
            userEvents = userEvents.filter((e) => new Date(e.timestamp) >= startDate);
        }
        if (endDate) {
            userEvents = userEvents.filter((e) => new Date(e.timestamp) <= endDate);
        }
        userEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        return userEvents.slice(0, limit);
    }
    async getEventsByEntity(entity, limit = 50) {
        const episodes = [];
        try {
            if (this.db) {
                // Query all user episode collections (requires composite index)
                const usersSnapshot = await this.db.collection('episodes').get();
                for (const userDoc of usersSnapshot.docs) {
                    const eventsSnapshot = await userDoc.ref
                        .collection('events')
                        .where('entities', 'array-contains', entity)
                        .orderBy('timestamp', 'desc')
                        .limit(limit)
                        .get();
                    eventsSnapshot.forEach(doc => {
                        const data = doc.data();
                        episodes.push({
                            id: data.id,
                            userId: data.userId,
                            timestamp: data.timestamp,
                            event: data.event,
                            entities: data.entities || [],
                            type: data.type,
                            metadata: data.metadata || {}
                        });
                    });
                }
                // Sort all results by timestamp
                episodes.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                return episodes.slice(0, limit);
            }
        }
        catch (error) {
            logger.info('⚠️ Firestore entity query error, using fallback:', error?.message);
        }
        // Fallback: search all users
        for (const [_userId, userEvents] of this.fallbackStore.entries()) {
            const matching = userEvents.filter((e) => e.entities && e.entities.includes(entity));
            episodes.push(...matching);
        }
        episodes.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        return episodes.slice(0, limit);
    }
}
const episodeStore = new FirestoreEpisodeStore();
/**
 * Handler: memory.event.save
 * Save timestamped event to episodic memory
 */
export async function memoryEventSave(params) {
    const { userId, event, type = 'general', metadata = {}, timestamp } = params;
    if (!userId) {
        throw new BadRequestError('userId is required for memory.event.save');
    }
    if (!event) {
        throw new BadRequestError('event is required for memory.event.save');
    }
    const savedEpisode = await episodeStore.saveEpisode({
        userId,
        event,
        type,
        metadata,
        timestamp
    });
    return ok({
        eventId: savedEpisode?.id,
        saved: true,
        message: 'Event saved to episodic memory',
        userId,
        event,
        type,
        timestamp: savedEpisode?.timestamp,
        entities: savedEpisode?.entities || []
    });
}
/**
 * Handler: memory.timeline.get
 * Retrieve events in time range
 */
export async function memoryTimelineGet(params) {
    const { userId, startDate, endDate, limit = 50 } = params;
    if (!userId) {
        throw new BadRequestError('userId is required for memory.timeline.get');
    }
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    const episodes = await episodeStore.getTimeline(userId, start, end, limit);
    return ok({
        userId,
        timeline: episodes,
        count: episodes.length,
        startDate: start?.toISOString(),
        endDate: end?.toISOString()
    });
}
/**
 * Handler: memory.entity.events
 * Get all events mentioning an entity
 */
export async function memoryEntityEvents(params) {
    const { entity, category, limit = 50 } = params;
    if (!entity) {
        throw new BadRequestError('entity is required for memory.entity.events');
    }
    const entityPattern = category ? `${category}:${entity}` : entity;
    const episodes = await episodeStore.getEventsByEntity(entityPattern, limit);
    return ok({
        entity: entityPattern,
        events: episodes,
        count: episodes.length,
        message: episodes.length > 0
            ? `Found ${episodes.length} events mentioning ${entity}`
            : `No events found for ${entity}`
    });
}
