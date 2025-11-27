import apiClient from "./client"

interface CalendarEvent {
  id?: string
  title: string
  start_time: string
  duration_minutes: number
  attendees: string[]
  description?: string
}

export const calendarAPI = {
  async scheduleEvent(event: CalendarEvent): Promise<any> {
    const response = await apiClient.instance.post("/api/productivity/calendar/schedule", event)
    return response.data
  },

  async listEvents(limit = 10): Promise<CalendarEvent[]> {
    const response = await apiClient.instance.get("/api/productivity/calendar/events", {
      params: { limit },
    })
    return response.data.events || []
  },
}
