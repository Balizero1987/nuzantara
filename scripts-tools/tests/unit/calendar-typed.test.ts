import { calendarCreate, calendarGet } from '../../src/handlers/google-workspace/calendar.js';

jest.mock('../../src/services/google-auth-service.js', () => ({
  getCalendar: async () => ({
    events: {
      insert: jest.fn().mockResolvedValue({ data: { id: 'evt1', summary: 'Meeting', start: { dateTime: '2025-10-06T09:00:00Z' }, end: { dateTime: '2025-10-06T10:00:00Z' } } }),
      get: jest.fn().mockResolvedValue({ data: { id: 'evt1', summary: 'Meeting' } })
    }
  })
}));

describe('Calendar handler typed shapes', () => {
  test('calendar.create returns ApiSuccess with event', async () => {
    const res = await calendarCreate({ summary: 'Meeting', start: { dateTime: '2025-10-06T09:00:00Z' }, end: { dateTime: '2025-10-06T10:00:00Z' } } as any);
    expect(res.ok).toBe(true);
    expect(res.data.event).toHaveProperty('id');
  });

  test('calendar.get returns ApiSuccess with event', async () => {
    const res = await calendarGet({ eventId: 'evt1' } as any);
    expect(res.ok).toBe(true);
    expect(res.data.event).toHaveProperty('id', 'evt1');
  });
});

