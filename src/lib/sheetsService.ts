export interface DriveFile {
  id: string;
  name: string;
  modifiedTime?: string;
  webViewLink?: string;
  owners?: { displayName?: string; emailAddress?: string }[];
}

export interface SheetTab {
  sheetId: number;
  title: string;
  index: number;
  gridProperties?: {
    rowCount?: number;
    columnCount?: number;
  };
}

export interface SpreadsheetMetadata {
  spreadsheetId: string;
  title: string;
  sheets: SheetTab[];
}

export interface SheetValuesResult {
  range: string;
  majorDimension: string;
  values: string[][];
}

/**
 * List all Google Sheets spreadsheets owned or accessible by the authenticated user in Google Drive
 */
export async function listSpreadsheets(accessToken: string): Promise<DriveFile[]> {
  const query = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
  const fields = encodeURIComponent("files(id,name,modifiedTime,webViewLink,owners)");
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&orderBy=modifiedTime%20desc&pageSize=30`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `Failed to list spreadsheets (${response.status})`);
  }

  const data = await response.json();
  return data.files || [];
}

/**
 * Retrieve spreadsheet metadata including sheet tabs and dimensions.
 * Best Practice: Always fetch metadata to discover real tab names instead of assuming "Sheet1".
 */
export async function getSpreadsheetMetadata(
  accessToken: string,
  spreadsheetId: string
): Promise<SpreadsheetMetadata> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=spreadsheetId,properties.title,sheets.properties(sheetId,title,gridProperties,index)`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `Failed to fetch spreadsheet metadata (${response.status})`);
  }

  const data = await response.json();
  const sheets: SheetTab[] = (data.sheets || []).map((s: any) => ({
    sheetId: s.properties?.sheetId,
    title: s.properties?.title || 'Sheet1',
    index: s.properties?.index ?? 0,
    gridProperties: s.properties?.gridProperties
  }));

  return {
    spreadsheetId: data.spreadsheetId,
    title: data.properties?.title || 'Untitled Spreadsheet',
    sheets
  };
}

/**
 * Fetch rows and cell values for a given sheet tab.
 */
export async function getSheetValues(
  accessToken: string,
  spreadsheetId: string,
  sheetTitle: string,
  range = 'A1:Z50'
): Promise<SheetValuesResult> {
  const fullRange = `${encodeURIComponent(sheetTitle)}!${range}`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${fullRange}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `Failed to read sheet values (${response.status})`);
  }

  const data = await response.json();
  return {
    range: data.range || fullRange,
    majorDimension: data.majorDimension || 'ROWS',
    values: data.values || []
  };
}

/**
 * Create a new Google Spreadsheet with custom initial sheet name, headers, and initial rows
 */
export async function createSpreadsheet(
  accessToken: string,
  title: string,
  sheetTitle: string,
  headerRow: string[],
  initialRows: string[][] = []
): Promise<{ spreadsheetId: string; webViewLink?: string; title: string }> {
  // Step 1: Create the spreadsheet container
  const createUrl = 'https://sheets.googleapis.com/v4/spreadsheets';
  const createResponse = await fetch(createUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: { title },
      sheets: [
        {
          properties: {
            title: sheetTitle,
            gridProperties: {
              frozenRowCount: 1
            }
          }
        }
      ]
    })
  });

  if (!createResponse.ok) {
    const errorData = await createResponse.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `Failed to create spreadsheet (${createResponse.status})`);
  }

  const createdData = await createResponse.json();
  const spreadsheetId = createdData.spreadsheetId;

  // Step 2: Populate header and initial rows
  const allRows = [headerRow, ...initialRows];
  if (allRows.length > 0) {
    const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetTitle)}!A1?valueInputOption=USER_ENTERED`;
    await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: allRows
      })
    });
  }

  return {
    spreadsheetId,
    webViewLink: createdData.spreadsheetUrl,
    title: createdData.properties?.title || title
  };
}

/**
 * Append a row of data to an existing sheet tab.
 */
export async function appendRow(
  accessToken: string,
  spreadsheetId: string,
  sheetTitle: string,
  rowValues: (string | number)[]
): Promise<{ updatedRange: string; updatedRows: number }> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetTitle)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      values: [rowValues.map(v => (v !== null && v !== undefined ? String(v) : ''))]
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `Failed to append row (${response.status})`);
  }

  const data = await response.json();
  return {
    updatedRange: data.updates?.updatedRange || '',
    updatedRows: data.updates?.updatedRows || 1
  };
}

/**
 * Delete a spreadsheet from Google Drive (moves to trash or removes)
 */
export async function deleteSpreadsheet(
  accessToken: string,
  spreadsheetId: string
): Promise<void> {
  const url = `https://www.googleapis.com/drive/v3/files/${spreadsheetId}`;

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok && response.status !== 204) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `Failed to delete spreadsheet (${response.status})`);
  }
}
