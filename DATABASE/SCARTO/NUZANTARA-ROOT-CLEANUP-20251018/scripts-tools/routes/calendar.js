import { Router } from 'express';
import { google } from 'googleapis';
import { createCalendarEvent } from '../calendar';
const router = Router();
// Calendar status endpoint
router.get('/status', async (req, res) => {
    try {
        const bridge = req.bridge;
        if (!bridge || !bridge.auth) {
            return res.status(503).json({
                status: 'ERROR',
                message: 'Calendar service not initialized',
                authenticated: false
            });
        }
        // Test calendar access
        const calendar = google.calendar({ version: 'v3', auth: bridge.auth });
        const response = await calendar.calendarList.list({
            maxResults: 1
        });
        res.json({
            status: 'CONNECTED',
            message: 'Google Calendar API is accessible',
            authenticated: true,
            calendarsFound: (response.data.items?.length || 0) > 0,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(500).json({
            status: 'ERROR',
            message: 'Calendar connection failed',
            error: error.message
        });
    }
});
// List calendars
router.get('/list', async (req, res) => {
    try {
        const bridge = req.bridge;
        if (!bridge || !bridge.auth) {
            return res.status(503).json({
                error: 'Calendar service not initialized'
            });
        }
        const calendar = google.calendar({ version: 'v3', auth: bridge.auth });
        const response = await calendar.calendarList.list({
            maxResults: 50,
            showDeleted: false,
            showHidden: false
        });
        res.json({
            calendars: response.data.items || [],
            count: response.data.items?.length || 0
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Failed to list calendars',
            details: error.message
        });
    }
});
// Get upcoming events
router.get('/events', async (req, res) => {
    try {
        const bridge = req.bridge;
        if (!bridge || !bridge.auth) {
            return res.status(503).json({
                error: 'Calendar service not initialized'
            });
        }
        const { calendarId = 'primary', maxResults = 10 } = req.query;
        const calendar = google.calendar({ version: 'v3', auth: bridge.auth });
        const response = await calendar.events.list({
            calendarId: calendarId,
            timeMin: new Date().toISOString(),
            maxResults: Number(maxResults),
            singleEvents: true,
            orderBy: 'startTime'
        });
        res.json({
            events: response.data.items || [],
            count: response.data.items?.length || 0,
            calendarId
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Failed to fetch events',
            details: error.message
        });
    }
});
// Create calendar event
router.post('/events', async (req, res) => {
    try {
        const bridge = req.bridge;
        if (!bridge || !bridge.auth) {
            return res.status(503).json({
                error: 'Calendar service not initialized'
            });
        }
        const { summary, description, start, end, attendees = [], createMeet = false, timeZone = 'Asia/Jakarta', sendUpdates = 'all' } = req.body;
        // Validate required fields
        if (!summary || !start || !end) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['summary', 'start', 'end']
            });
        }
        const event = await createCalendarEvent(bridge.auth, {
            summary,
            description,
            start,
            end,
            attendees,
            createMeet,
            timeZone,
            sendUpdates
        });
        res.json({
            success: true,
            event,
            message: 'Event created successfully',
            meetLink: event.hangoutLink || null
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Failed to create event',
            details: error.message
        });
    }
});
// Update calendar event
router.put('/events/:eventId', async (req, res) => {
    try {
        const bridge = req.bridge;
        if (!bridge || !bridge.auth) {
            return res.status(503).json({
                error: 'Calendar service not initialized'
            });
        }
        const { eventId } = req.params;
        const { calendarId = 'primary' } = req.query;
        const updates = req.body;
        const calendar = google.calendar({ version: 'v3', auth: bridge.auth });
        const response = await calendar.events.update({
            calendarId: calendarId,
            eventId: eventId,
            requestBody: updates,
            sendUpdates: 'all'
        });
        res.json({
            success: true,
            event: response.data,
            message: 'Event updated successfully'
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Failed to update event',
            details: error.message
        });
    }
});
// Delete calendar event
router.delete('/events/:eventId', async (req, res) => {
    try {
        const bridge = req.bridge;
        if (!bridge || !bridge.auth) {
            return res.status(503).json({
                error: 'Calendar service not initialized'
            });
        }
        const { eventId } = req.params;
        const { calendarId = 'primary', sendUpdates = 'all' } = req.query;
        const calendar = google.calendar({ version: 'v3', auth: bridge.auth });
        await calendar.events.delete({
            calendarId: calendarId,
            eventId: eventId,
            sendUpdates: sendUpdates
        });
        res.json({
            success: true,
            message: 'Event deleted successfully'
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Failed to delete event',
            details: error.message
        });
    }
});
export default router;
