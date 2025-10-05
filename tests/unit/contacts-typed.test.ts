import { contactsList, contactsCreate } from '../../src/handlers/google-workspace/contacts.js';

jest.mock('../../src/services/google-auth-service.js', () => ({
  getContacts: async () => ({
    people: {
      connections: {
        list: jest.fn().mockResolvedValue({
          data: {
            connections: [
              {
                resourceName: 'people/123',
                names: [{ displayName: 'Amanda' }],
                emailAddresses: [{ value: 'amanda@example.com' }],
                phoneNumbers: [{ value: '+62 811-2345-678' }],
                organizations: [{ name: 'Bali Zero', title: 'Admin' }],
                photos: [{ url: 'http://photo' }]
              }
            ],
            nextPageToken: 'NEXT'
          }
        })
      },
      createContact: jest.fn().mockResolvedValue({
        data: {
          resourceName: 'people/456',
          names: [{ displayName: 'Zainal' }],
          emailAddresses: [{ value: 'zainal@example.com' }],
          phoneNumbers: [{ value: '+62 812-0000-111' }]
        }
      })
    }
  })
}));

describe('Contacts handler typed shapes', () => {
  test('contacts.list returns ApiSuccess with contacts and token', async () => {
    const res = await contactsList({ pageSize: 10 } as any);
    expect(res.ok).toBe(true);
    expect(Array.isArray(res.data.contacts)).toBe(true);
    expect(res.data).toHaveProperty('nextPageToken', 'NEXT');
  });

  test('contacts.create returns ApiSuccess with new contact', async () => {
    const res = await contactsCreate({ name: 'Zainal', email: 'zainal@example.com' } as any);
    expect(res.ok).toBe(true);
    expect(res.data.contact).toHaveProperty('created', true);
    expect(res.data.contact).toHaveProperty('name', 'Zainal');
  });

  test('contacts.create rejects when both name and email are missing', async () => {
    await expect(contactsCreate({} as any)).rejects.toThrow('Either name or email is required');
  });
});
