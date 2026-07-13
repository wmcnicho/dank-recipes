import { SYNC_URL, SYNC_SECRET } from "./config";

const urlFor = () => localStorage.getItem("syncUrl") || SYNC_URL;

export const syncEnabled = () => Boolean(urlFor());

// text/plain keeps POSTs a CORS "simple request" — Apps Script can't answer
// preflight OPTIONS. The body is still JSON.
async function post(body) {
  const res = await fetch(urlFor(), {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ ...body, secret: SYNC_SECRET }),
  });
  if (!res.ok) throw new Error(`POST ${res.status}`);
  const data = await res.json().catch(() => ({}));
  if (data.error) throw new Error(data.error);
  return data;
}

// Returns { week, recipes }; recipes is null on a v1 backend that only
// serves the week (the app shows an update banner and disables v2 features).
export async function fetchState() {
  const res = await fetch(urlFor());
  if (!res.ok) throw new Error(`GET ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data.week)) throw new Error("unexpected payload");
  return { week: data.week, recipes: Array.isArray(data.recipes) ? data.recipes : null };
}

export const saveWeek = (week) => post({ action: "setWeek", week });

export const addRecipe = ({ title, url }) => post({ action: "addRecipe", title, url });

export const markCooked = ({ title, url, date }) =>
  post({ action: "markCooked", title, url, date });
