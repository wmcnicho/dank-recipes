import { SYNC_URL, SYNC_SECRET } from "./config";

const urlFor = () => localStorage.getItem("syncUrl") || SYNC_URL;

export const syncEnabled = () => Boolean(urlFor());

// Week entries are {title, url} — the shape stored in the sheet's
// "Current Recipes" tab, so the tab stays human-readable.
export async function fetchWeek() {
  const res = await fetch(urlFor());
  if (!res.ok) throw new Error(`GET ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data.week)) throw new Error("unexpected payload");
  return data.week;
}

export async function saveWeek(week) {
  // text/plain keeps this a CORS "simple request" — Apps Script can't
  // answer preflight OPTIONS. The body is still JSON.
  const res = await fetch(urlFor(), {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "setWeek", secret: SYNC_SECRET, week }),
  });
  if (!res.ok) throw new Error(`POST ${res.status}`);
  const data = await res.json().catch(() => ({}));
  if (data.error) throw new Error(data.error);
}
