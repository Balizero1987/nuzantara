/**
 * Calendar Routes
 * Extracted from router.ts (modular refactor)
 */

import { Router } from 'express';
import { z } from 'zod';
import { ok, err } from '../../utils/response.ts';
import { apiKeyAuth, RequestWithCtx } from '../../middleware/auth.ts';
import { calendarList, calendarCreate, calendarGet } from '../../handlers/google-workspace/calendar.ts';

const router = Router();

// Calendar schemas
const CalendarListSchema = z.object({
  calendarId: z.string().optional(),
  timeMin: z.string().optional(),
  timeMax: z.string().optional(),
  maxResults: z.number().optional().default(25),
  singleEvents: z.boolean().optional().default(true),
  orderBy: z.enum(['startTime', 'updated']).optional(),
});

const CalendarCreateSchema = z.object({
  calendarId: z.string().optional(),
  event: z.any().optional(),
  summary: z.string().optional(),
  start: z.any().optional(),
  end: z.any().optional(),
  description: z.string().optional(),
  attendees: z.array(z.object({
    email: z.string().email(),
    displayName: z.string().optional(),
  })).optional(),
  location: z.string().optional(),
}).refine(
  (data) => data.event || (data.summary && data.start && data.end),
  { message: 'Either event object or summary/start/end fields are required' }
);

const CalendarGetSchema = z.object({
  calendarId: z.string().optional(),
  eventId: z.string(),
});

/**
 * POST /api/calendar/list
 * List calendar events
 */
router.post('/list', apiKeyAuth, async (req: RequestWithCtx, res) => {
  try {
    const params = CalendarListSchema.parse(req.body);
    const result = await calendarList(params);
    return res.json(ok(result));
  } catch (error: any) {
    return res.status(400).json(err(error.message));
  }
});

/**
 * POST /api/calendar/create
 * Create new calendar event
 */
router.post('/create', apiKeyAuth, async (req: RequestWithCtx, res) => {
  try {
    const params = CalendarCreateSchema.parse(req.body);
    const result = await calendarCreate(params);
    return res.json(ok(result));
  } catch (error: any) {
    return res.status(400).json(err(error.message));
  }
});

/**
 * POST /api/calendar/get
 * Get calendar event by ID
 */
router.post('/get', apiKeyAuth, async (req: RequestWithCtx, res) => {
  try {
    const params = CalendarGetSchema.parse(req.body);
    const result = await calendarGet(params);
    return res.json(ok(result));
  } catch (error: any) {
    return res.status(400).json(err(error.message));
  }
});

export default router;
