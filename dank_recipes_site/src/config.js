// Apps Script web app URL (Deploy > Manage deployments > Web app URL).
// Empty = sync disabled; the tray falls back to this browser's localStorage.
// Can also be overridden per-browser via localStorage key "syncUrl".
export const SYNC_URL = "";

// Must match SECRET in apps_script/Code.gs.
export const SYNC_SECRET = "dank-recipes-2026";
