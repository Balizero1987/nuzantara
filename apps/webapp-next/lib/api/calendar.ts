import { apiClient } from "./client"

interface CalendarEvent {
  id?: string
  title: string
  start_time: string
  duration_minutes: number
  attendees: string[]
  description?: string
}

export const calendarAPI = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async scheduleEvent(event: CalendarEvent): Promise<any> {
    const response = await apiClient.client.post("/api/productivity/calendar/schedule", event)
    return response.data
  },

  async listEvents(limit = 10): Promise<CalendarEvent[]> {
    const response = await apiClient.client.get("/api/productivity/calendar/events", {
      params: { limit },
    })
    return response.data.events || []
  },
}
