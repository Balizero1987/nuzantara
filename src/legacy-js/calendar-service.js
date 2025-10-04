#!/usr/bin/env node

/**
 * ZANTARA Calendar Service - Service Account Impersonation
 * Bypasses OAuth2 verification requirement
 */

import { google } from 'googleapis';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

class CalendarService {
  constructor() {
    this.auth = null;
    this.calendar = null;
    this.impersonateUser = process.env.IMPERSONATE_USER || 'zero@balizero.com';
  }

  /**
   * Initialize with Service Account + Impersonation
   */
  async initialize() {
    try {
      console.log('🔐 Initializing Calendar Service with Service Account...');
      
      // Load service account key
      const keyFilePath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      if (!keyFilePath) {
        throw new Error('GOOGLE_APPLICATION_CREDENTIALS not set');
      }

      const keyFile = JSON.parse(fs.readFileSync(keyFilePath, 'utf8'));
      
      // Create JWT client with subject for impersonation
      this.auth = new google.auth.JWT({
        email: keyFile.client_email,
        key: keyFile.private_key,
        scopes: [
          'https://www.googleapis.com/auth/calendar',
          'https://www.googleapis.com/auth/calendar.events'
        ],
        subject: this.impersonateUser // This is the key for impersonation!
      });

      // Authorize
      await this.auth.authorize();
      console.log(`✅ Authorized as Service Account impersonating: ${this.impersonateUser}`);

      // Create calendar client
      this.calendar = google.calendar({ version: 'v3', auth: this.auth });
      
      return true;
    } catch (error) {
      console.error('❌ Calendar initialization failed:', error.message);
      if (error.message.includes('unauthorized_client')) {
        console.log('\n⚠️  Domain-wide delegation not configured properly.');
        console.log('Fix: Go to Google Workspace Admin > Security > API Controls');
        console.log('Add Client ID:', keyFile?.client_id);
        console.log('With scopes: https://www.googleapis.com/auth/calendar');
      }
      return false;
    }
  }

  /**
   * List calendar events
   */
  async listEvents(calendarId = 'primary', maxResults = 10) {
    try {
      const response = await this.calendar.events.list({
        calendarId,
        timeMin: new Date().toISOString(),
        maxResults,
        singleEvents: true,
        orderBy: 'startTime',
      });

      const events = response.data.items;
      if (!events || events.length === 0) {
        console.log('No upcoming events found.');
        return [];
      }

      console.log(`\n📅 Upcoming events for ${this.impersonateUser}:`);
      events.forEach(event => {
        const start = event.start.dateTime || event.start.date;
        console.log(`- ${start}: ${event.summary}`);
      });

      return events;
    } catch (error) {
      console.error('❌ Error listing events:', error.message);
      throw error;
    }
  }

  /**
   * Create a calendar event
   */
  async createEvent(eventData) {
    try {
      const event = {
        summary: eventData.summary || 'ZANTARA Meeting',
        location: eventData.location || 'Online',
        description: eventData.description || 'Created by ZANTARA',
        start: {
          dateTime: eventData.startTime || new Date(Date.now() + 3600000).toISOString(),
          timeZone: eventData.timeZone || 'Asia/Makassar',
        },
        end: {
          dateTime: eventData.endTime || new Date(Date.now() + 7200000).toISOString(),
          timeZone: eventData.timeZone || 'Asia/Makassar',
        },
        attendees: eventData.attendees || [],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 10 },
          ],
        },
      };

      const response = await this.calendar.events.insert({
        calendarId: 'primary',
        resource: event,
      });

      console.log(`✅ Event created: ${response.data.htmlLink}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating event:', error.message);
      throw error;
    }
  }

  /**
   * Delete an event
   */
  async deleteEvent(eventId, calendarId = 'primary') {
    try {
      await this.calendar.events.delete({
        calendarId,
        eventId,
      });
      console.log(`✅ Event deleted: ${eventId}`);
      return true;
    } catch (error) {
      console.error('❌ Error deleting event:', error.message);
      throw error;
    }
  }
}

// Test the service
async function testCalendarService() {
  const service = new CalendarService();
  
  const initialized = await service.initialize();
  if (!initialized) {
    console.log('\n❌ Failed to initialize Calendar Service');
    console.log('\nTroubleshooting steps:');
    console.log('1. Ensure Domain-wide delegation is enabled');
    console.log('2. Add the service account Client ID to Google Workspace');
    console.log('3. Grant calendar scopes to the service account');
    return;
  }

  console.log('\n🧪 Testing Calendar Service...');
  
  try {
    // List events
    console.log('\n1. Listing upcoming events...');
    await service.listEvents();

    // Create test event
    console.log('\n2. Creating test event...');
    const testEvent = await service.createEvent({
      summary: 'ZANTARA Test Event',
      description: 'Test event created by ZANTARA Calendar Service',
      startTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      endTime: new Date(Date.now() + 90000000).toISOString(),   // Tomorrow + 1h
    });

    // Wait a bit
    console.log('\n3. Waiting 2 seconds...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Delete test event
    console.log('\n4. Deleting test event...');
    await service.deleteEvent(testEvent.id);

    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

// Export for use in handlers
export default CalendarService;

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testCalendarService();
}