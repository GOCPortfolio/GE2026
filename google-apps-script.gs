/**
 * RSVP collector for the Ene & Oche wedding site.
 * Paste this whole file into Extensions > Apps Script of a Google Sheet,
 * then Deploy > New deployment > Web app (Execute as: Me, Who has access: Anyone).
 * Paste the Web app URL into CONFIG.rsvp.endpoint in script.js.
 */
var SHEET_NAME = 'RSVPs';
var HEADERS = ['Received', 'Name', 'Phone', 'Attending', 'Guests', 'Message'];

// Stops spreadsheet formulas such as =HYPERLINK(...) being run from a guest's text.
function safe_(v) {
  v = String(v == null ? '' : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim();
  if (v.length > 500) v = v.slice(0, 500);
  return /^[=+\-@\t\r]/.test(v) ? "'" + v : v;
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var data = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (data.website) return ok_('ignored');                      // honeypot field was filled: a bot

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
    var row = sheet.getLastRow() + 1;
    sheet.getRange(row, 3).setNumberFormat('@');                  // text format keeps the leading zero in phone numbers
    sheet.getRange(row, 1, 1, 6).setValues([[
      new Date(),
      safe_(data.name),
      safe_(data.phone),
      safe_(data.attending),
      Number(data.guests) || 0,
      safe_(data.message)
    ]]);
    return ok_('saved');
  } catch (err) {
    return ok_('error: ' + err);
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

function doGet() { return ok_('RSVP endpoint is live'); }

function ok_(msg) {
  return ContentService.createTextOutput(msg).setMimeType(ContentService.MimeType.TEXT);
}
