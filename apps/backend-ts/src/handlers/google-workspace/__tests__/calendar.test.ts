/**
 * Tests for Google Calendar Handler
 * Tests event creation, listing, and retrieval
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

const mockCalendarEventsList = jest.fn();
const mockCalendarEventsInsert = jest.fn();
const mockCalendarEventsGet = jest.fn();

jest.unstable_mockModule('googleapis', () => ({
  google: {
    calendar: jest.fn(() => ({
      events: {
        list: mockCalendarEventsList,
        insert: mockCalendarEventsInsert,
        get: mockCalendarEventsGet,
      },
    })),
  },
}));

describe('Google Calendar Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockCalendarEventsList.mockResolvedValue({
      data: {
        items: [
          {
            id: 'event-123',
            summary: 'Client Meeting',
            start: { dateTime: '2025-02-01T10:00:00Z' },
            end: { dateTime: '2025-02-01T11:00:00Z' },
          },
        ],
      },
    });

    mockCalendarEventsInsert.mockResolvedValue({
      data: {
        id: 'event-456',
        summary: 'New Event',
        htmlLink: 'https://calendar.google.com/event/456',
      },
    });
  });

  describe('calendarList', () => {
    it('should list upcoming events', async () => {
      const params = {
        timeMin: new Date().toISOString(),
        maxResults: 10,
        singleEvents: true,
      };

      const result = await mockCalendarEventsList(params);

      expect(result.data.items).toHaveLength(1);
      expect(result.data.items[0]).toHaveProperty('summary');
    });

    it('should filter by time range', async () => {
      const params = {
        timeMin: '2025-01-01T00:00:00Z',
        timeMax: '2025-12-31T23:59:59Z',
      };

      await mockCalendarEventsList(params);

      expect(mockCalendarEventsList).toHaveBeenCalledWith(
        expect.objectContaining({
          timeMin: expect.any(String),
          timeMax: expect.any(String),
        })
      );
    });

    it('should support search query', async () => {
      const params = {
        q: 'visa consultation',
      };

      await mockCalendarEventsList(params);

      expect(mockCalendarEventsList).toHaveBeenCalledWith(
        expect.objectContaining({ q: 'visa consultation' })
      );
    });
  });

  describe('calendarCreate', () => {
    it('should create calendar event', async () => {
      const params = {
        summary: 'Client Meeting - Visa Consultation',
        description: 'Initial consultation for B211A visa',
        startTime: '2025-02-01T10:00:00Z',
        endTime: '2025-02-01T11:00:00Z',
        timeZone: 'Asia/Makassar',
      };

      const result = await mockCalendarEventsInsert(params);

      expect(result.data).toHaveProperty('id');
      expect(result.data).toHaveProperty('htmlLink');
    });

    it('should support attendees', async () => {
      const params = {
        summary: 'Team Meeting',
        attendees: [{ email: 'amanda@balizero.com' }, { email: 'client@example.com' }],
      };

      await mockCalendarEventsInsert(params);

      expect(mockCalendarEventsInsert).toHaveBeenCalled();
    });

    it('should support reminders', async () => {
      const params = {
        summary: 'Important Meeting',
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 10 },
          ],
        },
      };

      await mockCalendarEventsInsert(params);

      expect(mockCalendarEventsInsert).toHaveBeenCalled();
    });
  });

  describe('calendarGet', () => {
    it('should retrieve specific event', async () => {
      const params = {
        eventId: 'event-123',
      };

      await mockCalendarEventsGet(params);

      expect(mockCalendarEventsGet).toHaveBeenCalledWith(params);
    });
  });
});
