import { useEffect, useMemo, useRef, useState } from "react";
import recipes from "./recipes.json";
import { syncEnabled, fetchWeek, saveWeek } from "./sync";
import "./App.css";

const LANES = [
  { key: "fish", label: "Fish", emoji: "🐟" },
  { key: "red meat", label: "Red Meat", emoji: "🥩" },
  { key: "chicken", label: "Chicken", emoji: "🍗" },
  { key: "veg", label: "Veg", emoji: "🥦" },
];
const ALL_PROTEINS = [...LANES, { key: "sweets", label: "Sweets", emoji: "🍰" }];

const byId = new Map(recipes.map((r) => [r.id, r]));
const byUrl = new Map(recipes.filter((r) => r.url).map((r) => [r.url, r.id]));
const byTitle = new Map(recipes.map((r) => [r.title.toLowerCase(), r.id]));

// Sheet rows -> known recipe ids + rows we don't recognize (added by hand
// in the sheet); unknown rows are kept and written back so the app never
// deletes them.
function matchWeek(week) {
  const ids = [];
  const unknown = [];
  for (const w of week) {
    const id = byUrl.get(w.url) ?? byTitle.get((w.title || "").toLowerCase());
    if (id !== undefined) {
      if (!ids.includes(id)) ids.push(id);
    } else if (w.title || w.url) {
      unknown.push(w);
    }
  }
  return { ids, unknown };
}

const weekPayload = (picks, unknown) => [
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
            {ALL_PROTEINS.find((p) => p.key === recipe.protein)?.emoji}
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

function WeekTray({ picks, unknown, onToggle, onClear, laneFilter, setLaneFilter, syncStatus }) {
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
      <div className="lanes">
        {LANES.map((lane) => {
          const lanePicks = picks.filter((id) => byId.get(id)?.protein === lane.key);
          const active = laneFilter === lane.key;
          return (
            <div
              key={lane.key}
              className={`lane ${lanePicks.length ? "filled" : ""} ${active ? "active" : ""}`}
              onClick={() => setLaneFilter(active ? null : lane.key)}
            >
              <div className="lane-label">
                {lane.emoji} {lane.label}
              </div>
              {lanePicks.length === 0 ? (
                <div className="lane-empty">pick one</div>
              ) : (
                lanePicks.map((id) => {
                  const r = byId.get(id);
                  return (
                    <div key={id} className="lane-pick" title={r.title}>
                      {r.image && <img src={r.image} alt="" />}
                      {r.url ? (
                        <a
                          className="lane-pick-title"
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {r.title}
                        </a>
                      ) : (
                        <span className="lane-pick-title">{r.title}</span>
                      )}
                      <button
                        className="remove-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggle(id);
                        }}
                      >
                        ×
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          );
        })}
      </div>
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

export default function App() {
  const [picks, setPicks] = useState(() => {
    try {
      return (JSON.parse(localStorage.getItem("weekPicks")) ?? []).filter((id) => byId.has(id));
    } catch {
      return [];
    }
  });
  const [unknownWeek, setUnknownWeek] = useState([]);
  const [syncStatus, setSyncStatus] = useState(syncEnabled() ? "loading" : "local");
  const [laneFilter, setLaneFilter] = useState(null);
  const [search, setSearch] = useState("");

  const serverLoaded = useRef(false);
  const lastSynced = useRef(null);

  // On load, the sheet is the source of truth for the week.
  useEffect(() => {
    if (!syncEnabled()) return;
    fetchWeek()
      .then((week) => {
        const { ids, unknown } = matchWeek(week);
        setPicks(ids);
        setUnknownWeek(unknown);
        lastSynced.current = JSON.stringify(weekPayload(ids, unknown));
        serverLoaded.current = true;
        setSyncStatus("synced");
      })
      .catch(() => setSyncStatus("error"));
  }, []);

  // Cache locally always; push to the sheet (debounced) once server state
  // has loaded, skipping no-op echoes of what we just fetched/saved.
  useEffect(() => {
    localStorage.setItem("weekPicks", JSON.stringify(picks));
    if (!serverLoaded.current) return;
    const payload = weekPayload(picks, unknownWeek);
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
  }, [picks, unknownWeek]);

  const togglePick = (id) =>
    setPicks((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const clearWeek = () => {
    setPicks([]);
    setUnknownWeek([]);
  };

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return recipes.filter(
      (r) =>
        (!laneFilter || r.protein === laneFilter) &&
        (!q || r.title.toLowerCase().includes(q) || (r.notes || "").toLowerCase().includes(q))
    );
  }, [laneFilter, search]);

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
      </header>

      <WeekTray
        picks={picks}
        unknown={unknownWeek}
        onToggle={togglePick}
        onClear={clearWeek}
        laneFilter={laneFilter}
        setLaneFilter={setLaneFilter}
        syncStatus={syncStatus}
      />

      <div className="filter-row">
        <button
          className={`chip ${laneFilter === null ? "active" : ""}`}
          onClick={() => setLaneFilter(null)}
        >
          All ({recipes.length})
        </button>
        {ALL_PROTEINS.map((p) => (
          <button
            key={p.key}
            className={`chip ${laneFilter === p.key ? "active" : ""}`}
            onClick={() => setLaneFilter(laneFilter === p.key ? null : p.key)}
          >
            {p.emoji} {p.label} ({recipes.filter((r) => r.protein === p.key).length})
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
