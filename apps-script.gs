/**
 * Dans Day – Google Apps Script backend
 *
 * Deploy as:  Execute as → Me  |  Who has access → Anyone
 *
 * Sheet structure
 * ───────────────
 * Tab "days"   → A: Date (YYYY-MM-DD), B: Status (good/violent), C: Note, D: Timestamp
 * Tab "config" → A: key,  B: value   (row: photo_url | <Google Drive URL>)
 *
 * All actions go through doGet to avoid CORS/redirect issues with POST from browsers.
 *
 * Actions (passed as ?action=... query param):
 *   getData              → returns { days: [...], photoUrl: '' }
 *   saveDay&date=...&status=...&note=...  → upserts a day, returns updated getData result
 *   setPhoto&photoUrl=...                → saves photo URL to config, returns { ok: true }
 */

const DAYS_SHEET   = 'days';
const CONFIG_SHEET = 'config';

// ── Main entry point ──────────────────────────────────────────
function doGet(e) {
  try {
    const params = e.parameter || {};
    const action = params.action || 'getData';
    const ss     = SpreadsheetApp.getActiveSpreadsheet();

    if (action === 'saveDay') {
      const date   = String(params.date   || '').trim();
      const status = String(params.status || '').trim();
      const note   = String(params.note   || '').trim();

      if (!date || !['good', 'violent'].includes(status)) {
        return jsonResponse({ error: 'missing or invalid date/status' });
      }

      const daysSheet = getOrCreateSheet(ss, DAYS_SHEET);
      ensureDaysHeader(daysSheet);

      const timestamp = new Date().toISOString();
      const rows      = daysSheet.getDataRange().getValues();
      const tz        = Session.getScriptTimeZone();

      // Upsert: update existing row if date matches
      // Sheets auto-parses ISO date strings as Date objects, so normalise before comparing
      for (let i = 1; i < rows.length; i++) {
        const cellDate = rows[i][0];
        const cellStr  = (cellDate instanceof Date)
          ? Utilities.formatDate(cellDate, tz, 'yyyy-MM-dd')
          : String(cellDate).trim();
        if (cellStr === date) {
          daysSheet.getRange(i + 1, 2, 1, 3).setValues([[status, note, timestamp]]);
          return jsonResponse(buildResponseData(ss));
        }
      }

      // Insert new row
      daysSheet.appendRow([date, status, note, timestamp]);
      return jsonResponse(buildResponseData(ss));
    }

    if (action === 'setPhoto') {
      const photoUrl    = String(params.photoUrl || '').trim();
      const configSheet = getOrCreateSheet(ss, CONFIG_SHEET);
      setConfig(configSheet, 'photo_url', photoUrl);
      return jsonResponse({ ok: true });
    }

    // Default: getData
    return jsonResponse(buildResponseData(ss));

  } catch (err) {
    return jsonResponse({ error: String(err) });
  }
}

// ── Build the standard response payload ──────────────────────
function buildResponseData(ss) {
  const daysSheet   = getOrCreateSheet(ss, DAYS_SHEET);
  const configSheet = getOrCreateSheet(ss, CONFIG_SHEET);

  const days    = [];
  const rawRows = daysSheet.getDataRange().getValues();
  const tz      = Session.getScriptTimeZone();
  for (let i = 0; i < rawRows.length; i++) {
    const row     = rawRows[i];
    const rawDate = row[0];
    if (!rawDate || rawDate === 'Date') continue;  // skip empty / header
    // Sheets auto-parses ISO date strings into Date objects — convert back to YYYY-MM-DD
    const dateStr = (rawDate instanceof Date)
      ? Utilities.formatDate(rawDate, tz, 'yyyy-MM-dd')
      : String(rawDate).trim();
    if (!dateStr || dateStr === 'Date') continue;
    // Timestamps may also be parsed as Date objects
    const rawTs = row[3];
    const tsStr = (rawTs instanceof Date) ? rawTs.toISOString() : String(rawTs || '');
    days.push({
      date:      dateStr,
      status:    String(row[1] || ''),
      note:      String(row[2] || ''),
      timestamp: tsStr,
    });
  }

  const photoUrl = getConfig(configSheet, 'photo_url');
  return { days, photoUrl };
}

// ── Helpers ──────────────────────────────────────────────────
function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateSheet(ss, name) {
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

function ensureDaysHeader(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Date', 'Status', 'Note', 'Timestamp']);
    sheet.getRange(1, 1, 1, 4).setFontWeight('bold');
  }
}

function getConfig(configSheet, key) {
  const rows = configSheet.getDataRange().getValues();
  for (const row of rows) {
    if (String(row[0]) === key) return String(row[1] || '');
  }
  return '';
}

function setConfig(configSheet, key, value) {
  const rows = configSheet.getDataRange().getValues();
  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i][0]) === key) {
      configSheet.getRange(i + 1, 2).setValue(value);
      return;
    }
  }
  configSheet.appendRow([key, value]);
}
