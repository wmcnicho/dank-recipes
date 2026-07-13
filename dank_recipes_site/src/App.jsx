import { useEffect, useMemo, useRef, useState } from "react";
import bakedRecipes from "./recipes.json";
import { syncEnabled, fetchState, saveWeek, addRecipe, markCooked } from "./sync";
import "./App.css";

const PROTEINS = [
  { key: "fish", label: "Fish", emoji: "🐟" },
  { key: "red meat", label: "Red Meat", emoji: "🥩" },
  { key: "chicken", label: "Chicken", emoji: "🍗" },
  { key: "veg", label: "Veg", emoji: "🥦" },
  { key: "sweets", label: "Sweets", emoji: "🍰" },
];

const normUrl = (u) => (u || "").split("?")[0].replace(/\/+$/, "");
const isUrl = (s) => /^https?:\/\//.test(s || "");

// Header rows of the sheet tab, past ("Recipe | Note") and present ("Title | Link")
const HEADER_TITLES = new Set(["recipe", "title"]);
const HEADER_URLS = new Set(["", "note", "link", "url"]);
const isHeaderRow = (title, url) =>
  HEADER_TITLES.has(title.toLowerCase()) && HEADER_URLS.has(url.toLowerCase());

// Same rules as build_data.py, for recipes added via the sheet/app that the
// baked JSON doesn't know yet.
const PROTEIN_RULES = [
  ["fish", /salmon|shrimp|tuna|swordfish|anchov|\bfish\b|scampi|prawn/],
  ["chicken", /chicken|turkey/],
  ["red meat", /\bbeef\b|\bpork\b|sausage|kebab|steak|lamb|meatball|\bham\b/],
  ["sweets", /\bcakes?\b|cookies?\b|muffin|brownie|rugelach|\btortes?\b/],
];
function classifyProtein(text) {
  const t = text.toLowerCase();
  for (const [protein, re] of PROTEIN_RULES) if (re.test(t)) return protein;
  return "veg";
}

function slugTitle(url) {
  try {
    const path = new URL(url).pathname.replace(/\/+$/, "");
    let slug = path.split("/").pop() || "";
    slug = slug.replace(/^\d+-/, "").replace(/\.\w+$/, "");
    const words = slug.replace(/[-_]+/g, " ").trim();
    return words ? words.replace(/\b\w/g, (c) => c.toUpperCase()) : url;
  } catch {
    return url;
  }
}

function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

// Baked recipes + rows from the sheet's All Recipes tab. Rows the baked JSON
// doesn't know become "dynamic" recipes: placeholder image, protein guessed
// from the title, id derived from url/title so picks stay stable.
function mergeRecipes(baked, sheetRows) {
  const merged = [...baked];
  const seenUrls = new Set(baked.filter((r) => r.url).map((r) => normUrl(r.url)));
  const seenTitles = new Set(baked.map((r) => r.title.toLowerCase()));
  for (const raw of sheetRows) {
    let title = (raw.title || "").trim();
    let url = (raw.url || "").trim();
    if (!url && isUrl(title)) {
      url = title;
      title = "";
    }
    if (!title && !url) continue;
    if (isHeaderRow(title, url)) continue;
    if (url && seenUrls.has(normUrl(url))) continue;
    if (!url && seenTitles.has(title.toLowerCase())) continue;
    if (!title) title = slugTitle(url);
    if (url) seenUrls.add(normUrl(url));
    seenTitles.add(title.toLowerCase());
    merged.push({
      id: "sheet:" + (url ? normUrl(url) : title.toLowerCase()),
      title,
      url: url || null,
      source: url ? hostOf(url) : null,
      maddyRating: null,
      hunterRating: null,
      dateCooked: raw.dateCooked || null,
      notes: null,
      protein: classifyProtein(title),
      image: null,
      dynamic: true,
    });
  }
  return merged;
}

function buildMaps(all) {
  return {
    byId: new Map(all.map((r) => [r.id, r])),
    byUrl: new Map(all.filter((r) => r.url).map((r) => [normUrl(r.url), r.id])),
    byTitle: new Map(all.map((r) => [r.title.toLowerCase(), r.id])),
  };
}

// Sheet week rows -> known recipe ids + rows we don't recognize (kept and
// written back so the app never deletes hand-typed rows). Tolerates bare
// URLs pasted into the title column.
function matchWeek(week, maps) {
  const ids = [];
  const unknown = [];
  for (const raw of week) {
    let title = (raw.title || "").trim();
    let url = (raw.url || "").trim();
    if (!url && isUrl(title)) {
      url = title;
      title = "";
    }
    if (!title && !url) continue;
    if (isHeaderRow(title, url)) continue;
    const id = maps.byUrl.get(normUrl(url)) ?? maps.byTitle.get(title.toLowerCase());
    if (id !== undefined) {
      if (!ids.includes(id)) ids.push(id);
    } else {
      unknown.push({ title, url });
    }
  }
  return { ids, unknown };
}

const weekPayload = (picks, unknown, byId) => [
  ...picks.map((id) => ({ title: byId.get(id).title, url: byId.get(id).url || "" })),
  ...unknown,
];

const SYNC_LABELS = {
  loading: "syncing…",
  saving: "saving…",
  synced: "✓ synced to sheet",
  error: "⚠ offline — this browser only",
};

function Stars({ rating }) {
  if (!rating) return null;
  return <span className="stars">{"★".repeat(rating)}</span>;
}

function RecipeCard({ recipe, selected, onToggle }) {
  return (
    <div
      className={`card protein-${recipe.protein.replace(" ", "-")} ${selected ? "selected" : ""}`}
      onClick={() => onToggle(recipe.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onToggle(recipe.id)}
    >
      <div className="card-image">
        {recipe.image ? (
          <img src={recipe.image} alt={recipe.title} loading="lazy" />
        ) : (
          <div className="image-placeholder">
            {PROTEINS.find((p) => p.key === recipe.protein)?.emoji}
          </div>
        )}
        {selected && <div className="check-badge">✓</div>}
        <span className="protein-tag">{recipe.protein}</span>
      </div>
      <div className="card-body">
        <h3>{recipe.title}</h3>
        <div className="card-meta">
          <Stars rating={recipe.maddyRating} />
          {recipe.source && <span className="source">{recipe.source}</span>}
          {recipe.url && (
            <a
              href={recipe.url}
              target="_blank"
              rel="noopener noreferrer"
              className="open-link"
              onClick={(e) => e.stopPropagation()}
            >
              recipe ↗
            </a>
          )}
        </div>
        {recipe.notes && <p className="notes">{recipe.notes}</p>}
      </div>
    </div>
  );
}

function TrayPick({ recipe, onToggle, onCook, canCook }) {
  const body = (
    <>
      {recipe.image && <img src={recipe.image} alt="" />}
      <span className="lane-pick-title">{recipe.title}</span>
    </>
  );
  return (
    <div className="lane-pick">
      {recipe.url ? (
        <a
          className="lane-pick-main"
          href={recipe.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          {body}
        </a>
      ) : (
        <span className="lane-pick-main">{body}</span>
      )}
      {canCook && (
        <button
          className="cook-btn"
          title="Cooked it! Stamps today into the sheet and clears it from the week."
          onClick={(e) => {
            e.stopPropagation();
            onCook(recipe.id);
          }}
        >
          🍳
        </button>
      )}
      <button
        className="remove-btn"
        title="Remove from this week"
        onClick={(e) => {
          e.stopPropagation();
          onToggle(recipe.id);
        }}
      >
        ×
      </button>
    </div>
  );
}

function WeekTray({
  picks,
  byId,
  unknown,
  onToggle,
  onCook,
  onClear,
  laneFilter,
  setLaneFilter,
  syncStatus,
  canCook,
}) {
  // Only lanes that have picks; each lane holds any number of them.
  const groups = PROTEINS.map((p) => ({
    ...p,
    items: picks.filter((id) => byId.get(id)?.protein === p.key),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="week-tray">
      <div className="tray-header">
        <h2>This Week</h2>
        {picks.length + unknown.length > 0 && (
          <button className="clear-btn" onClick={onClear}>
            clear ({picks.length + unknown.length})
          </button>
        )}
        {SYNC_LABELS[syncStatus] && (
          <span className={`sync-status ${syncStatus}`}>{SYNC_LABELS[syncStatus]}</span>
        )}
      </div>
      {groups.length === 0 && unknown.length === 0 ? (
        <div className="tray-empty">Tap recipes below to plan the week.</div>
      ) : (
        <div className="lanes">
          {groups.map((lane) => {
            const active = laneFilter === lane.key;
            return (
              <div
                key={lane.key}
                className={`lane filled ${active ? "active" : ""}`}
                onClick={() => setLaneFilter(active ? null : lane.key)}
              >
                <div className="lane-label">
                  {lane.emoji} {lane.label} {lane.items.length > 1 && `× ${lane.items.length}`}
                </div>
                {lane.items.map((id) => (
                  <TrayPick
                    key={id}
                    recipe={byId.get(id)}
                    onToggle={onToggle}
                    onCook={onCook}
                    canCook={canCook}
                  />
                ))}
              </div>
            );
          })}
        </div>
      )}
      {unknown.length > 0 && (
        <div className="unknown-week">
          also on the sheet:{" "}
          {unknown.map((w, i) => (
            <span key={i}>
              {i > 0 && ", "}
              {w.url ? (
                <a href={w.url} target="_blank" rel="noopener noreferrer">
                  {w.title || w.url}
                </a>
              ) : (
                w.title
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function AddRecipeForm({ onAdd, onClose, byUrl }) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    const u = url.trim();
    if (!isUrl(u)) {
      setError("Paste a full recipe URL (https://…)");
      return;
    }
    if (byUrl.has(normUrl(u))) {
      setError("That recipe is already in the collection.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onAdd({ title: title.trim() || slugTitle(u), url: u });
      onClose();
    } catch {
      setError("Couldn't save to the sheet — try again.");
      setBusy(false);
    }
  };

  return (
    <form className="add-form" onSubmit={submit}>
      <input
        type="url"
        placeholder="Recipe URL (https://…)"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        autoFocus
        required
      />
      <input
        type="text"
        placeholder="Title (optional — guessed from the URL)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <div className="add-form-actions">
        <button type="submit" disabled={busy}>
          {busy ? "Adding…" : "Add to collection"}
        </button>
        <button type="button" className="ghost" onClick={onClose}>
          cancel
        </button>
        {error && <span className="add-error">{error}</span>}
      </div>
    </form>
  );
}

export default function App() {
  const [picks, setPicks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("weekPicks")) ?? [];
    } catch {
      return [];
    }
  });
  const [unknownWeek, setUnknownWeek] = useState([]);
  const [sheetRecipes, setSheetRecipes] = useState([]);
  const [legacyBackend, setLegacyBackend] = useState(false);
  const [syncStatus, setSyncStatus] = useState(syncEnabled() ? "loading" : "local");
  const [laneFilter, setLaneFilter] = useState(null);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const allRecipes = useMemo(() => mergeRecipes(bakedRecipes, sheetRecipes), [sheetRecipes]);
  const maps = useMemo(() => buildMaps(allRecipes), [allRecipes]);
  const { byId, byUrl } = maps;

  const serverLoaded = useRef(false);
  const lastSynced = useRef(null);

  // On load, the sheet is the source of truth for the week. The cancelled
  // flag drops stale responses (StrictMode double-mount, remount races) so
  // a late fetch can't overwrite picks made after a faster one applied.
  useEffect(() => {
    if (!syncEnabled()) return;
    let cancelled = false;
    fetchState()
      .then(({ week, recipes: rows }) => {
        if (cancelled) return;
        setLegacyBackend(rows === null);
        setSheetRecipes(rows ?? []);
        const m = buildMaps(mergeRecipes(bakedRecipes, rows ?? []));
        const { ids, unknown } = matchWeek(week, m);
        setPicks(ids);
        setUnknownWeek(unknown);
        lastSynced.current = JSON.stringify(weekPayload(ids, unknown, m.byId));
        serverLoaded.current = true;
        setSyncStatus("synced");
      })
      .catch(() => {
        if (!cancelled) setSyncStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Cache locally always; push to the sheet (debounced) once server state
  // has loaded, skipping no-op echoes of what we just fetched/saved.
  useEffect(() => {
    localStorage.setItem("weekPicks", JSON.stringify(picks));
    if (!serverLoaded.current) return;
    const payload = weekPayload(picks, unknownWeek, byId);
    const serialized = JSON.stringify(payload);
    if (serialized === lastSynced.current) return;
    setSyncStatus("saving");
    const t = setTimeout(() => {
      saveWeek(payload)
        .then(() => {
          lastSynced.current = serialized;
          setSyncStatus("synced");
        })
        .catch(() => setSyncStatus("error"));
    }, 800);
    return () => clearTimeout(t);
  }, [picks, unknownWeek, byId]);

  const togglePick = (id) =>
    setPicks((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const clearWeek = () => {
    setPicks([]);
    setUnknownWeek([]);
  };

  const cookIt = (id) => {
    const r = byId.get(id);
    setPicks((p) => p.filter((x) => x !== id));
    const d = new Date();
    const date = `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
    markCooked({ title: r.title, url: r.url || "", date }).catch(() =>
      setSyncStatus("error")
    );
  };

  const handleAdd = async ({ title, url }) => {
    if (!legacyBackend && syncEnabled()) {
      await addRecipe({ title, url });
    }
    setSheetRecipes((rows) => [...rows, { title, url }]);
    setLaneFilter(null);
    setSearch(title); // reveal the new card
  };

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allRecipes.filter(
      (r) =>
        (!laneFilter || r.protein === laneFilter) &&
        (!q || r.title.toLowerCase().includes(q) || (r.notes || "").toLowerCase().includes(q))
    );
  }, [allRecipes, laneFilter, search]);

  const canCook = syncEnabled() && !legacyBackend;

  return (
    <div className="app">
      <header>
        <h1>🔥 Dank Recipes</h1>
        <input
          type="search"
          placeholder="Search recipes…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {canCook && (
          <button className="add-btn" onClick={() => setShowAdd((s) => !s)}>
            + Add recipe
          </button>
        )}
      </header>

      {showAdd && (
        <AddRecipeForm onAdd={handleAdd} onClose={() => setShowAdd(false)} byUrl={byUrl} />
      )}

      {legacyBackend && (
        <div className="banner">
          The sheet backend is out of date — cooking log and adding recipes are off. Paste
          the latest <code>apps_script/Code.gs</code> into Extensions → Apps Script, then
          Deploy → Manage deployments → edit → New version.
        </div>
      )}

      <WeekTray
        picks={picks}
        byId={byId}
        unknown={unknownWeek}
        onToggle={togglePick}
        onCook={cookIt}
        onClear={clearWeek}
        laneFilter={laneFilter}
        setLaneFilter={setLaneFilter}
        syncStatus={syncStatus}
        canCook={canCook}
      />

      <div className="filter-row">
        <button
          className={`chip ${laneFilter === null ? "active" : ""}`}
          onClick={() => setLaneFilter(null)}
        >
          All ({allRecipes.length})
        </button>
        {PROTEINS.map((p) => (
          <button
            key={p.key}
            className={`chip ${laneFilter === p.key ? "active" : ""}`}
            onClick={() => setLaneFilter(laneFilter === p.key ? null : p.key)}
          >
            {p.emoji} {p.label} ({allRecipes.filter((r) => r.protein === p.key).length})
          </button>
        ))}
      </div>

      <div className="grid">
        {visible.map((r) => (
          <RecipeCard
            key={r.id}
            recipe={r}
            selected={picks.includes(r.id)}
            onToggle={togglePick}
          />
        ))}
        {visible.length === 0 && <p className="no-results">No recipes match.</p>}
      </div>
    </div>
  );
}
