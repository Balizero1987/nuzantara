import { ok } from "../../utils/response.js";
import { BadRequestError } from "../../utils/errors.js";
import { forwardToBridgeIfSupported } from "../../services/bridgeProxy.js";
import { getCalendar } from "../../services/google-auth-service.js";

// Using centralized Google authentication service

export async function calendarList(params: any) {
  const { calendarId = 'primary', timeMin, timeMax, maxResults = 25, singleEvents = true, orderBy = 'startTime' } = params || {};
  const cal = await getCalendar();
  if (cal) {
    const res = await cal.events.list({ calendarId, timeMin, timeMax, maxResults, singleEvents, orderBy });
    return ok({ events: res.data.items || [] });
  }
  const bridged = await forwardToBridgeIfSupported('calendar.list', params);
  if (bridged) return bridged;
  throw new BadRequestError('Calendar not configured');
}

export async function calendarCreate(params: any) {
  const {
    calendarId = 'primary',
    event,
    summary,
    start,
    end,
    description,
    attendees,
    location
  } = params || {};

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
  const bridged = await forwardToBridgeIfSupported('calendar.create', params);
  if (bridged) return bridged;
  throw new BadRequestError('Calendar not configured');
}

export async function calendarGet(params: any) {
  const { calendarId = 'primary', eventId } = params || {};
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
  const bridged = await forwardToBridgeIfSupported('calendar.get', params);
  if (bridged) return bridged;
  throw new BadRequestError('Calendar not configured');
}

