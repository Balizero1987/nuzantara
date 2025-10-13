import { google } from 'googleapis';
import { BridgeError } from '../utils/errors.js';
/**
 * Create a new Google Spreadsheet
 */
export async function createSpreadsheet(auth, params) {
    try {
        const sheets = google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.create({
            requestBody: {
                properties: {
                    title: params.title
                }
            }
        });
        const spreadsheetId = response.data.spreadsheetId;
        // Add headers if provided
        if (params.headers && params.headers.length > 0) {
            await sheets.spreadsheets.values.append({
                spreadsheetId,
                range: 'Sheet1!A1',
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: [params.headers]
                }
            });
        }
        // Add initial data if provided
        if (params.data && params.data.length > 0) {
            const startRow = params.headers ? 2 : 1;
            await sheets.spreadsheets.values.append({
                spreadsheetId,
                range: `Sheet1!A${startRow}`,
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: params.data
                }
            });
        }
        return {
            spreadsheetId: response.data.spreadsheetId,
            spreadsheetUrl: response.data.spreadsheetUrl,
            title: response.data.properties?.title,
            created: true
        };
    }
    catch (error) {
        throw new BridgeError(500, 'SHEETS_CREATE_ERROR', `Failed to create spreadsheet: ${error.message}`);
    }
}
/**
 * Append data to a spreadsheet
 */
export async function appendData(auth, params) {
    try {
        const sheets = google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.values.append({
            spreadsheetId: params.spreadsheetId,
            range: params.range,
            valueInputOption: params.valueInputOption || 'USER_ENTERED',
            requestBody: {
                values: params.values
            }
        });
        return {
            spreadsheetId: params.spreadsheetId,
            updatedRange: response.data.updates?.updatedRange,
            updatedRows: response.data.updates?.updatedRows,
            updatedColumns: response.data.updates?.updatedColumns,
            updatedCells: response.data.updates?.updatedCells
        };
    }
    catch (error) {
        throw new BridgeError(500, 'SHEETS_APPEND_ERROR', `Failed to append data: ${error.message}`);
    }
}
/**
 * Read data from spreadsheet
 */
export async function readData(auth, spreadsheetId, range) {
    try {
        const sheets = google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range
        });
        return {
            range: response.data.range || range,
            values: response.data.values || []
        };
    }
    catch (error) {
        throw new BridgeError(500, 'SHEETS_READ_ERROR', `Failed to read data: ${error.message}`);
    }
}
/**
 * Get spreadsheet metadata
 */
export async function getSpreadsheetInfo(auth, spreadsheetId) {
    try {
        const sheets = google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.get({
            spreadsheetId,
            fields: 'properties,sheets.properties'
        });
        return {
            spreadsheetId,
            title: response.data.properties?.title,
            locale: response.data.properties?.locale,
            timeZone: response.data.properties?.timeZone,
            sheets: response.data.sheets?.map(sheet => ({
                title: sheet.properties?.title,
                sheetId: sheet.properties?.sheetId,
                index: sheet.properties?.index
            }))
        };
    }
    catch (error) {
        throw new BridgeError(500, 'SHEETS_INFO_ERROR', `Failed to get spreadsheet info: ${error.message}`);
    }
}
/**
 * Export conversation data to spreadsheet - Zantara specific
 */
export async function exportConversationData(auth, conversationData) {
    try {
        const title = `Zantara Conversations Export - ${new Date().toISOString().split('T')[0]}`;
        const headers = [
            'Timestamp',
            'User ID',
            'Message',
            'Response',
            'Profile Facts',
            'Summary Updated',
            'Session Duration'
        ];
        const rows = conversationData.map(conv => [
            conv.timestamp || new Date().toISOString(),
            conv.userId || 'unknown',
            conv.userMessage || '',
            conv.assistantResponse || '',
            JSON.stringify(conv.profileFacts || []),
            conv.summaryUpdated ? 'Yes' : 'No',
            conv.sessionDuration || 0
        ]);
        const result = await createSpreadsheet(auth, {
            title,
            headers,
            data: rows
        });
        return {
            ...result,
            exportType: 'conversation_data',
            recordCount: rows.length,
            exportedAt: new Date().toISOString()
        };
    }
    catch (error) {
        throw new BridgeError(500, 'CONVERSATION_EXPORT_ERROR', `Failed to export conversation data: ${error.message}`);
    }
}
