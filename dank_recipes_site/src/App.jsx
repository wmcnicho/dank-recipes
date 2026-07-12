import { useEffect, useMemo, useState } from "react";
import recipes from "./recipes.json";
import "./App.css";

const LANES = [
  { key: "fish", label: "Fish", emoji: "🐟" },
  { key: "red meat", label: "Red Meat", emoji: "🥩" },
  { key: "chicken", label: "Chicken", emoji: "🍗" },
  { key: "veg", label: "Veg", emoji: "🥦" },
];
const ALL_PROTEINS = [...LANES, { key: "sweets", label: "Sweets", emoji: "🍰" }];

const proteinOf = (id) => recipes.find((r) => r.id === id)?.protein;

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

function WeekTray({ picks, onToggle, onClear, laneFilter, setLaneFilter }) {
  return (
    <div className="week-tray">
      <div className="tray-header">
        <h2>This Week</h2>
        {picks.length > 0 && (
          <button className="clear-btn" onClick={onClear}>
            clear ({picks.length})
          </button>
        )}
      </div>
      <div className="lanes">
        {LANES.map((lane) => {
          const lanePicks = picks.filter((id) => proteinOf(id) === lane.key);
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
                  const r = recipes.find((x) => x.id === id);
                  return (
                    <div key={id} className="lane-pick" title={r.title}>
                      {r.image && <img src={r.image} alt="" />}
                      <span className="lane-pick-title">{r.title}</span>
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
    </div>
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
  const [laneFilter, setLaneFilter] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    localStorage.setItem("weekPicks", JSON.stringify(picks));
  }, [picks]);

  const togglePick = (id) =>
    setPicks((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

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
        onToggle={togglePick}
        onClear={() => setPicks([])}
        laneFilter={laneFilter}
        setLaneFilter={setLaneFilter}
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
