/* eslint-disable @typescript-eslint/no-explicit-any */
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Mock axios
const mockAxios = {
  post: jest.fn(),
  get: jest.fn(),
};

// Mock apiClient
const mockApiClient = {
  getToken: jest.fn(() => 'test-token'),
};

jest.mock('axios', () => ({
  default: mockAxios,
}));

jest.mock('../client', () => ({
  apiClient: mockApiClient,
}));

// Import module under test
import { calendarAPI } from '../calendar';

describe('calendarAPI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('scheduleEvent', () => {
    it('should schedule an event successfully', async () => {
      const event = {
        title: 'Team Meeting',
        start_time: '2024-01-15T10:00:00Z',
        duration_minutes: 60,
        attendees: ['user1@example.com', 'user2@example.com'],
        description: 'Weekly sync',
      };

      const responseData = { id: '123', ...event };
      (mockAxios.post as any).mockResolvedValue({ data: responseData });

      const result = await calendarAPI.scheduleEvent(event);

      expect(mockAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/productivity/calendar/schedule'),
        event,
        { headers: { Authorization: 'Bearer test-token' } }
      );
      expect(result).toEqual(responseData);
    });

    it('should include authorization header', async () => {
      const event = {
        title: 'Meeting',
        start_time: '2024-01-15T10:00:00Z',
        duration_minutes: 30,
        attendees: [],
      };

      (mockAxios.post as any).mockResolvedValue({ data: { id: '456' } });

      await calendarAPI.scheduleEvent(event);

      expect(mockAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          headers: { Authorization: 'Bearer test-token' },
        })
      );
    });

    it('should handle API errors', async () => {
      const event = {
        title: 'Meeting',
        start_time: '2024-01-15T10:00:00Z',
        duration_minutes: 30,
        attendees: [],
      };

      (mockAxios.post as any).mockRejectedValue(new Error('Network error'));

      await expect(calendarAPI.scheduleEvent(event)).rejects.toThrow('Network error');
    });

    it('should handle event without description', async () => {
      const event = {
        title: 'Quick Meeting',
        start_time: '2024-01-15T10:00:00Z',
        duration_minutes: 15,
        attendees: ['user@example.com'],
      };

      (mockAxios.post as any).mockResolvedValue({ data: { id: '789' } });

      const result = await calendarAPI.scheduleEvent(event);

      expect(result).toEqual({ id: '789' });
    });
  });

  describe('listEvents', () => {
    it('should list events with default limit', async () => {
      const events = [
        {
          id: '1',
          title: 'Event 1',
          start_time: '2024-01-15T10:00:00Z',
          duration_minutes: 30,
          attendees: [],
        },
        {
          id: '2',
          title: 'Event 2',
          start_time: '2024-01-15T14:00:00Z',
          duration_minutes: 60,
          attendees: [],
        },
      ];

      (mockAxios.get as any).mockResolvedValue({ data: { events } });

      const result = await calendarAPI.listEvents();

      expect(mockAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/productivity/calendar/events'),
        expect.objectContaining({
          params: { limit: 10 },
          headers: { Authorization: 'Bearer test-token' },
        })
      );
      expect(result).toEqual(events);
    });

    it('should list events with custom limit', async () => {
      const events = [
        {
          id: '1',
          title: 'Event 1',
          start_time: '2024-01-15T10:00:00Z',
          duration_minutes: 30,
          attendees: [],
        },
      ];
      (mockAxios.get as any).mockResolvedValue({ data: { events } });

      const result = await calendarAPI.listEvents(5);

      expect(mockAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: { limit: 5 },
        })
      );
      expect(result).toEqual(events);
    });

    it('should return empty array when no events', async () => {
      (mockAxios.get as any).mockResolvedValue({ data: {} });

      const result = await calendarAPI.listEvents();

      expect(result).toEqual([]);
    });

    it('should return empty array when events is null', async () => {
      (mockAxios.get as any).mockResolvedValue({ data: { events: null } });

      const result = await calendarAPI.listEvents();

      expect(result).toEqual([]);
    });

    it('should handle API errors', async () => {
      (mockAxios.get as any).mockRejectedValue(new Error('Unauthorized'));

      await expect(calendarAPI.listEvents()).rejects.toThrow('Unauthorized');
    });

    it('should include authorization header', async () => {
      (mockAxios.get as any).mockResolvedValue({ data: { events: [] } });

      await calendarAPI.listEvents();

      expect(mockAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: { Authorization: 'Bearer test-token' },
        })
      );
    });
  });
});
