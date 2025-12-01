import axios from 'axios';
import { apiClient } from '@/lib/api/client';

interface CalendarEvent {
  id?: string;
  title: string;
  start_time: string;
  duration_minutes: number;
  attendees: string[];
  description?: string;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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
