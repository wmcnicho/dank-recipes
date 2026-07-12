/**
 * Dank Recipes sync backend — a web app bound to the recipe spreadsheet.
 * Reads/writes the "Current Recipes" tab so the site's "This Week" tray
 * is shared across machines (and stays editable in the sheet itself).
 *
 * Setup (one time, ~3 minutes):
 *   1. Open the Dank Recipes spreadsheet in Google Sheets.
 *   2. Extensions > Apps Script. Delete the placeholder and paste this file.
 *   3. If your weekly tab isn't named exactly "Current Recipes", edit WEEK_TAB.
 *   4. Deploy > New deployment > type: Web app.
 *      - Execute as: Me
 *      - Who has access: Anyone
 *   5. Authorize when prompted, then copy the Web app URL
 *      (https://script.google.com/macros/s/…/exec) into SYNC_URL in
 *      dank_recipes_site/src/config.js and redeploy the site.
 *
 * After editing this script later, use Deploy > Manage deployments >
 * edit (pencil) > Version: New version — otherwise the URL keeps serving
 * the old code.
 */
const WEEK_TAB = "Current Recipes";
const SECRET = "dank-recipes-2026"; // must match SYNC_SECRET in src/config.js

function weekSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(WEEK_TAB);
  if (!sheet) {
    sheet = ss.insertSheet(WEEK_TAB);
    sheet.appendRow(["Title", "Link"]);
  }
  return sheet;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function doGet() {
  const values = weekSheet_().getDataRange().getValues();
  const week = [];
  for (let i = 0; i < values.length; i++) {
    const title = String(values[i][0] || "").trim();
    const url = String(values[i][1] || "").trim();
    if (!title && !url) continue;
    if (title.toLowerCase() === "title") continue; // header row
    week.push({ title: title, url: url });
  }
  return json_({ week: week });
}

function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return json_({ error: "bad json" });
  }
  if (body.secret !== SECRET) return json_({ error: "unauthorized" });
  if (body.action !== "setWeek" || !Array.isArray(body.week)) {
    return json_({ error: "bad request" });
  }

  const sheet = weekSheet_();
  const rows = [["Title", "Link"]];
  body.week.forEach(function (w) {
    rows.push([String(w.title || ""), String(w.url || "")]);
  });
  sheet.clearContents();
  sheet.getRange(1, 1, rows.length, 2).setValues(rows);
  return json_({ ok: true, count: body.week.length });
}
