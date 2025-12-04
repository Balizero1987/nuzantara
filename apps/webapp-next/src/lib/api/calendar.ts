import axios from 'axios';
import { apiClient } from './client';

interface CalendarEvent {
  id?: string;
  title: string;
  start_time: string;
  duration_minutes: number;
  attendees: string[];
  description?: string;
}

// Use production URL in non-dev environments, with secure fallback
const getBaseURL = (): string => {
    if (process.env.NEXT_PUBLIC_API_URL) {
        return process.env.NEXT_PUBLIC_API_URL;
    }
    if (typeof window !== 'undefined' &&
        (window.location.hostname.includes('fly.dev') || window.location.hostname.includes('nuzantara'))) {
        return 'https://nuzantara-rag.fly.dev';
    }
    return 'http://localhost:8080';
};
const BASE_URL = getBaseURL();

export const calendarAPI = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async scheduleEvent(event: CalendarEvent): Promise<any> {
    const token = apiClient.getToken();
    const response = await axios.post(`${BASE_URL}/api/productivity/calendar/schedule`, event, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async listEvents(limit = 10): Promise<CalendarEvent[]> {
    const token = apiClient.getToken();
    const response = await axios.get(`${BASE_URL}/api/productivity/calendar/events`, {
      params: { limit },
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.events || [];
  },
};
