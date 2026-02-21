/**
 * Dans Day – Google Apps Script backend
 *
 * Deploy as:  Execute as → Me  |  Who has access → Anyone
 *
 * Sheet structure
 * ───────────────
 * Tab "days"   → A: Date (YYYY-MM-DD), B: Status (good/violent), C: Note, D: Timestamp
 * Tab "config" → A: key,  B: value   (row: photo_url | <Google Drive URL>)
 */

const DAYS_SHEET   = 'days';
const CONFIG_SHEET = 'config';

// ── GET ──────────────────────────────────────────────────────
// Called by the app on load: returns { days: [...], photoUrl: '' }
function doGet(e) {
  try {
    const ss          = SpreadsheetApp.getActiveSpreadsheet();
    const daysSheet   = getOrCreateSheet(ss, DAYS_SHEET);
    const configSheet = getOrCreateSheet(ss, CONFIG_SHEET);

    // Read all day rows (skip header if present)
    const days = [];
    const rawRows = daysSheet.getDataRange().getValues();
    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      if (!row[0] || row[0] === 'Date') continue;  // skip empty / header
      days.push({
        date:      String(row[0]),
        status:    String(row[1] || ''),
        note:      String(row[2] || ''),
        timestamp: String(row[3] || ''),
      });
    }

    // Read photo URL from config tab
    const photoUrl = getConfig(configSheet, 'photo_url');

    const result = { days, photoUrl };
    return jsonResponse(result);

  } catch (err) {
    return jsonResponse({ error: String(err) });
  }
}

// ── POST ─────────────────────────────────────────────────────
// Two actions:
//   { action: 'setPhoto', photoUrl: '...' }         → saves photo URL to config
//   { date: 'YYYY-MM-DD', status: '...', note: '' } → upserts a day entry
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const ss   = SpreadsheetApp.getActiveSpreadsheet();

    if (body.action === 'setPhoto') {
      const configSheet = getOrCreateSheet(ss, CONFIG_SHEET);
      setConfig(configSheet, 'photo_url', body.photoUrl || '');
      return jsonResponse({ ok: true });
    }

    // Save / update day entry
    const daysSheet = getOrCreateSheet(ss, DAYS_SHEET);
    const date      = String(body.date   || '').trim();
    const status    = String(body.status || '').trim();
    const note      = String(body.note   || '').trim();

    if (!date || !status) return jsonResponse({ error: 'missing fields' });

    ensureDaysHeader(daysSheet);

    const timestamp = new Date().toISOString();
    const rows      = daysSheet.getDataRange().getValues();

    // Try to find existing row with matching date
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][0]) === date) {
        daysSheet.getRange(i + 1, 2, 1, 3).setValues([[status, note, timestamp]]);
        return jsonResponse({ ok: true, action: 'updated' });
      }
    }

    // Append new row
    daysSheet.appendRow([date, status, note, timestamp]);
    return jsonResponse({ ok: true, action: 'inserted' });

  } catch (err) {
    return jsonResponse({ error: String(err) });
  }
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
