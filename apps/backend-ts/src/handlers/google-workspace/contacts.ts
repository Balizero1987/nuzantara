import { ok } from '../../utils/response.js';
import { BadRequestError } from '../../utils/errors.js';
import { forwardToBridgeIfSupported } from '../../services/bridgeProxy.js';
import { getContacts } from '../../services/google-auth-service.js';

// Param interfaces
export interface ContactsListParams {
  pageSize?: number;
  sortOrder?: 'FIRST_NAME_ASCENDING' | 'LAST_NAME_ASCENDING';
}
export interface ContactsCreateParams {
  name?: string;
  email?: string;
  phone?: string;
  organization?: string;
  title?: string;
  address?: string;
  notes?: string;
}

// Result interfaces
export interface ContactsListResult {
  contacts: Array<{
    resourceName?: string;
    name: string;
    email: string | null;
    phone: string | null;
    organization: string | null;
    title: string | null;
    hasPhoto: boolean;
  }>;
  totalContacts: number;
  nextPageToken: string | null;
}
export interface ContactsCreateResult {
  contact: {
    resourceName?: string;
    name?: string;
    email?: string;
    phone?: string;
    created: boolean;
  };
}

export async function contactsList(params: ContactsListParams) {
  const { pageSize = 50, sortOrder = 'LAST_NAME_ASCENDING' } = params || ({} as ContactsListParams);

  const contacts = await getContacts();
  if (contacts) {
    try {
      const res = await contacts.people.connections.list({
        resourceName: 'people/me',
        pageSize,
        personFields: 'names,emailAddresses,phoneNumbers,organizations,addresses,metadata,photos',
        sortOrder,
      });

      const people = res.data.connections || [];

      // Format contacts for better readability
      const formattedContacts = people.map((person: any) => {
        const name = person.names?.[0]?.displayName || 'No name';
        const email = person.emailAddresses?.[0]?.value || null;
        const phone = person.phoneNumbers?.[0]?.value || null;
        const organization = person.organizations?.[0]?.name || null;
        const title = person.organizations?.[0]?.title || null;
        const resourceName = person.resourceName;

        return {
          resourceName,
          name,
          email,
          phone,
          organization,
          title,
          hasPhoto: !!person.photos?.[0]?.url,
        };
      });

      return ok({
        contacts: formattedContacts,
        totalContacts: people.length,
        nextPageToken: res.data.nextPageToken || null,
      });
    } catch (error: any) {
      throw new BadRequestError(`Contacts list failed: ${error.message}`);
    }
  }

  // Fallback to Bridge legacy implementation
  const bridged = await forwardToBridgeIfSupported('contacts.list', params);
  if (bridged) return bridged;
  throw new BadRequestError('Google Contacts not configured');
}

export async function contactsCreate(params: ContactsCreateParams) {
  const { name, email, phone, organization, title, address, notes } =
    params || ({} as ContactsCreateParams);

  if (!name && !email) {
    throw new BadRequestError('Either name or email is required');
  }

  const contacts = await getContacts();
  if (contacts) {
    try {
      // Build contact object
      const contact: any = {};

      if (name) {
        contact.names = [
          {
            displayName: name,
            givenName: name.split(' ')[0] || name,
            familyName: name.split(' ').slice(1).join(' ') || '',
          },
        ];
      }

      if (email) {
        contact.emailAddresses = [
          {
            value: email,
            type: 'work',
          },
        ];
      }

      if (phone) {
        contact.phoneNumbers = [
          {
            value: phone,
            type: 'work',
          },
        ];
      }

      if (organization || title) {
        contact.organizations = [
          {
            name: organization || '',
            title: title || '',
            type: 'work',
          },
        ];
      }

      if (address) {
        contact.addresses = [
          {
            formattedValue: address,
            type: 'work',
          },
        ];
      }

      if (notes) {
        contact.biographies = [
          {
            value: notes,
            contentType: 'TEXT_PLAIN',
          },
        ];
      }

      const res = await contacts.people.createContact({
        requestBody: contact,
      });

      return ok({
        contact: {
          resourceName: res.data.resourceName,
          name: res.data.names?.[0]?.displayName,
          email: res.data.emailAddresses?.[0]?.value,
          phone: res.data.phoneNumbers?.[0]?.value,
          created: true,
        },
      });
    } catch (error: any) {
      throw new BadRequestError(`Contact creation failed: ${error.message}`);
    }
  }

  // Fallback to Bridge legacy implementation
  const bridged = await forwardToBridgeIfSupported('contacts.create', params);
  if (bridged) return bridged;
  throw new BadRequestError('Google Contacts not configured');
}
