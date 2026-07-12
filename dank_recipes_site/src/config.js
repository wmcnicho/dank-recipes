// Apps Script web app URL (Deploy > Manage deployments > Web app URL).
// Empty = sync disabled; the tray falls back to this browser's localStorage.
// Can also be overridden per-browser via localStorage key "syncUrl".
export const SYNC_URL =
  "https://script.google.com/macros/s/AKfycbyiioL7v4LCyOBWuxP4GaEnDeBK3Jgmdz6m8Swzqr3XriiglQhCCUWBV3vmXe4HLTYRgQ/exec";

// Must match SECRET in apps_script/Code.gs.
export const SYNC_SECRET = "dank-recipes-2026";
