import { ok } from "../../utils/response.js";
import { BadRequestError } from "../../utils/errors.js";
import { forwardToBridgeIfSupported } from "../../services/bridgeProxy.js";
import { getCalendar } from "../../services/google-auth-service.js";

// Using centralized Google authentication service

// Minimal param interfaces (Step 1 typing)
export interface CalendarListParams {
  calendarId?: string;
  timeMin?: string;
  timeMax?: string;
  maxResults?: number;
  singleEvents?: boolean;
  orderBy?: 'startTime' | 'updated';
}

export interface CalendarCreateParams {
  calendarId?: string;
  event?: any;
  summary?: string;
  start?: any;
  end?: any;
  description?: string;
  attendees?: Array<{ email: string; displayName?: string }>;
  location?: string;
}

export interface CalendarGetParams { calendarId?: string; eventId: string }

export async function calendarList(params: CalendarListParams) {
  const { calendarId = 'primary', timeMin, timeMax, maxResults = 25, singleEvents = true, orderBy = 'startTime' } = params || {} as CalendarListParams;
  const cal = await getCalendar();
  if (cal) {
    const res = await cal.events.list({ calendarId, timeMin, timeMax, maxResults, singleEvents, orderBy });
    return ok({ events: res.data.items || [] });
  }
  const bridged = await forwardToBridgeIfSupported('calendar.list', params as any);
  if (bridged) return bridged;
  throw new BadRequestError('Calendar not configured');
}

export async function calendarCreate(params: CalendarCreateParams) {
  const {
    calendarId = 'primary',
    event,
    summary,
    start,
    end,
    description,
    attendees,
    location
  } = params || ({} as CalendarCreateParams);

  let requestBody = event as any;

  if (!requestBody) {
    if (!summary || !start || !end) {
      throw new BadRequestError('event is required (provide `event` object or summary/start/end fields)');
    }

    requestBody = { summary, start, end } as any;
    if (description) requestBody.description = description;
    if (location) requestBody.location = location;
    if (Array.isArray(attendees) && attendees.length > 0) {
      requestBody.attendees = attendees;
    }
  }

  const cal = await getCalendar();
  if (cal) {
    const res = await cal.events.insert({ calendarId, requestBody });
    return ok({ event: res.data });
  }
  const bridged = await forwardToBridgeIfSupported('calendar.create', params as any);
  if (bridged) return bridged;
  throw new BadRequestError('Calendar not configured');
}

export async function calendarGet(params: CalendarGetParams) {
  const { calendarId = 'primary', eventId } = params || ({} as CalendarGetParams);
  if (!eventId) throw new BadRequestError('eventId is required');

  const cal = await getCalendar();
  if (cal) {
    try {
      const res = await cal.events.get({ calendarId, eventId });
      return ok({ event: res.data });
    } catch (error: any) {
      if (error.code === 404) {
        throw new BadRequestError('Event not found');
      }
      throw error;
    }
  }
  const bridged = await forwardToBridgeIfSupported('calendar.get', params as any);
  if (bridged) return bridged;
  throw new BadRequestError('Calendar not configured');
}
