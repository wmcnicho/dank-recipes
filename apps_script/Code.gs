/**
 * Dank Recipes sync backend — a web app bound to the recipe spreadsheet.
 *
 * GET  -> { week: [...], recipes: [...] }
 *         week    = rows of the "Current Recipes" tab (the shared weekly plan)
 *         recipes = rows of the "All Recipes" tab (title, url, dateCooked)
 * POST -> { action, secret, ... } where action is one of:
 *         setWeek    { week: [{title, url}] }  replace the weekly plan
 *         addRecipe  { title, url }            append to All Recipes (dedupes by url)
 *         markCooked { title, url, date }      stamp Date Cooked in All Recipes
 *                                              and append to the "Cook Log" tab
 *
 * Setup (one time, ~3 minutes):
 *   1. Open the Dank Recipes spreadsheet in Google Sheets.
 *   2. Extensions > Apps Script. Replace the code with this file.
 *   3. Check the tab-name constants below match your sheet.
 *   4. Deploy > New deployment > type: Web app.
 *      - Execute as: Me
 *      - Who has access: Anyone
 *   5. Authorize, copy the Web app URL into SYNC_URL in
 *      dank_recipes_site/src/config.js, and redeploy the site.
 *
 * Updating an existing deployment (keeps the same URL):
 *   Paste the new code, then Deploy > Manage deployments > edit (pencil) >
 *   Version: New version > Deploy. Without a new version the URL keeps
 *   serving the old code.
 */
const WEEK_TAB = "Current Recipes";
const ALL_TAB = "All Recipes";
const LOG_TAB = "Cook Log";
const SECRET = "dank-recipes-2026"; // must match SYNC_SECRET in src/config.js

// All Recipes tab columns: A=Title, B=Link, C=Maddy Rating, D=Hunter Rating,
// E=Date Cooked, F=Notes
const COL_DATE_COOKED = 5;

function ss_() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function norm_(u) {
  return String(u || "").split("?")[0].replace(/\/+$/, "");
}

function weekSheet_() {
  let sheet = ss_().getSheetByName(WEEK_TAB);
  if (!sheet) {
    sheet = ss_().insertSheet(WEEK_TAB);
    sheet.appendRow(["Title", "Link"]);
  }
  return sheet;
}

function readWeek_() {
  const values = weekSheet_().getDataRange().getValues();
  const week = [];
  for (let i = 0; i < values.length; i++) {
    const title = String(values[i][0] || "").trim();
    const url = String(values[i][1] || "").trim();
    if (!title && !url) continue;
    if (title.toLowerCase() === "title") continue; // header row
    week.push({ title: title, url: url });
  }
  return week;
}

function readRecipes_() {
  const sheet = ss_().getSheetByName(ALL_TAB);
  if (!sheet) return [];
  const values = sheet.getDataRange().getValues();
  const recipes = [];
  for (let i = 1; i < values.length; i++) {
    // skip header
    const title = String(values[i][0] || "").trim();
    const url = String(values[i][1] || "").trim();
    if (!title && !url) continue;
    recipes.push({
      title: title,
      url: url,
      dateCooked: values[i][COL_DATE_COOKED - 1]
        ? String(values[i][COL_DATE_COOKED - 1])
        : "",
    });
  }
  return recipes;
}

function doGet() {
  return json_({ week: readWeek_(), recipes: readRecipes_() });
}

function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return json_({ error: "bad json" });
  }
  if (body.secret !== SECRET) return json_({ error: "unauthorized" });

  if (body.action === "setWeek" && Array.isArray(body.week)) {
    return setWeek_(body.week);
  }
  if (body.action === "addRecipe") {
    return addRecipe_(body);
  }
  if (body.action === "markCooked") {
    return markCooked_(body);
  }
  return json_({ error: "bad request" });
}

function setWeek_(week) {
  const sheet = weekSheet_();
  const rows = [["Title", "Link"]];
  week.forEach(function (w) {
    rows.push([String(w.title || ""), String(w.url || "")]);
  });
  sheet.clearContents();
  sheet.getRange(1, 1, rows.length, 2).setValues(rows);
  return json_({ ok: true, count: week.length });
}

function addRecipe_(body) {
  const title = String(body.title || "").trim();
  const url = String(body.url || "").trim();
  if (!url) return json_({ error: "url required" });
  const sheet = ss_().getSheetByName(ALL_TAB);
  if (!sheet) return json_({ error: "missing tab: " + ALL_TAB });
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (norm_(values[i][1]) === norm_(url)) {
      return json_({ ok: true, duplicate: true });
    }
  }
  sheet.appendRow([title, url]);
  return json_({ ok: true });
}

function markCooked_(body) {
  const url = norm_(body.url);
  const title = String(body.title || "").trim().toLowerCase();
  const date = String(body.date || "").trim();
  if (!date) return json_({ error: "date required" });

  let matched = false;
  const sheet = ss_().getSheetByName(ALL_TAB);
  if (sheet) {
    const values = sheet.getDataRange().getValues();
    for (let i = 1; i < values.length; i++) {
      const rowTitle = String(values[i][0] || "").trim().toLowerCase();
      const rowUrl = norm_(values[i][1]);
      if ((url && rowUrl === url) || (title && rowTitle === title)) {
        sheet.getRange(i + 1, COL_DATE_COOKED).setValue(date);
        matched = true;
        break;
      }
    }
  }

  let log = ss_().getSheetByName(LOG_TAB);
  if (!log) {
    log = ss_().insertSheet(LOG_TAB);
    log.appendRow(["Date", "Title", "Link"]);
  }
  log.appendRow([date, String(body.title || ""), String(body.url || "")]);

  return json_({ ok: true, matched: matched });
}
