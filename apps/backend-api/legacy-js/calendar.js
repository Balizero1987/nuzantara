import { google } from "googleapis";
import { v4 as uuidv4 } from "uuid";
export async function createCalendarEvent(auth, payload) {
    const calendar = google.calendar({ version: "v3", auth: auth });
    const timeZone = payload.timeZone ?? "Asia/Jakarta";
    const event = {
        summary: payload.summary,
        description: payload.description,
        start: { dateTime: payload.start, timeZone },
        end: { dateTime: payload.end, timeZone },
        attendees: payload.attendees
    };
    if (payload.createMeet) {
        event.conferenceData = {
            createRequest: { requestId: uuidv4() }
        };
    }
    const res = await calendar.events.insert({
        calendarId: "primary",
        requestBody: event,
        conferenceDataVersion: payload.createMeet ? 1 : 0,
        sendUpdates: payload.sendUpdates ?? "all",
        supportsAttachments: true
    });
    return res.data;
}
