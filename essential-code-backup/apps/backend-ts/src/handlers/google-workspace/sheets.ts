import { ok } from '../../utils/response.js';
import { BadRequestError } from '../../utils/errors.js';
import { forwardToBridgeIfSupported } from '../../services/bridgeProxy.js';
import { getSheets } from '../../services/google-auth-service.js';

// Minimal param interfaces (Step 1 typing)
export interface SheetsReadParams {
  spreadsheetId: string;
  range: string;
}
export interface SheetsAppendParams {
  spreadsheetId: string;
  range: string;
  values: any[][];
  valueInputOption?: 'RAW' | 'USER_ENTERED';
}
export interface SheetsCreateParams {
  title: string;
  data?: any[][];
}

// Result interfaces
export interface SheetsReadResult {
  values: any[][];
  range: string;
}
export interface SheetsAppendResult {
  update: any | null;
}
export interface SheetsCreateResult {
  spreadsheetId?: string;
  url: string;
}

export async function sheetsRead(params: SheetsReadParams) {
  const { spreadsheetId, range } = params || ({} as SheetsReadParams);
  if (!spreadsheetId || !range) throw new BadRequestError('spreadsheetId and range are required');
  const sheets = await getSheets();
  if (sheets) {
    const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    return ok({ values: res.data.values || [], range });
  }
  const bridged = await forwardToBridgeIfSupported('sheets.read', params);
  if (bridged) return bridged;
  throw new BadRequestError('Sheets not configured');
}

export async function sheetsAppend(params: SheetsAppendParams) {
  const {
    spreadsheetId,
    range,
    values,
    valueInputOption = 'RAW',
  } = params || ({} as SheetsAppendParams);
  if (!spreadsheetId || !range || !values)
    throw new BadRequestError('spreadsheetId, range and values are required');
  const sheets = await getSheets();
  if (sheets) {
    const res = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption,
      requestBody: { values },
    });
    return ok({ update: res.data.updates || null });
  }
  const bridged = await forwardToBridgeIfSupported('sheets.append', params as any);
  if (bridged) return bridged;
  throw new BadRequestError('Sheets not configured');
}

export async function sheetsCreate(params: SheetsCreateParams) {
  const { title, data } = params || ({} as SheetsCreateParams);
  if (!title) throw new BadRequestError('title is required');

  const sheets = await getSheets();
  if (sheets) {
    // Create the spreadsheet
    const res = await sheets.spreadsheets.create({
      requestBody: {
        properties: { title },
        sheets: [
          {
            properties: { title: 'Sheet1' },
          },
        ],
      },
    });

    const spreadsheetId = res.data.spreadsheetId;

    // If initial data is provided, add it
    if (data && Array.isArray(data) && data.length > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetId!,
        range: 'Sheet1!A1',
        valueInputOption: 'RAW',
        requestBody: { values: data },
      });
    }

    return ok({
      spreadsheetId,
      url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    });
  }

  // Fallback to bridge if sheets service not available
  const bridged = await forwardToBridgeIfSupported('sheets.create', params as any);
  if (bridged) return bridged;
  throw new BadRequestError('Sheets not configured');
}
