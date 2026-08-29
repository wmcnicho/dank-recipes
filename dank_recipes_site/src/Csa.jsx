import { useEffect, useMemo, useState } from "react";
import recipes from "./recipes.json";
import { parseBox, pairingsFor, matchIngredient } from "./pairings";
import "./Csa.css";

// Prototype: everything lives in this browser (localStorage), no sheet sync yet.
const STORE_KEY = "csaState";

const newId = () => Math.random().toString(36).slice(2, 9);

const loadState = () => {
  try {
    const s = JSON.parse(localStorage.getItem(STORE_KEY));
    if (s && Array.isArray(s.box) && Array.isArray(s.ideas)) return s;
  } catch {
    /* fall through */
  }
  return { box: [], ideas: [] };
};

// Recipes from the collection that mention this ingredient in the title
function collectionMatches(name) {
  const q = name.toLowerCase().replace(/s$/, "");
  return recipes.filter((r) => r.title.toLowerCase().includes(q)).slice(0, 4);
}

function PasteZone({ onParsed }) {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);

  const parse = () => {
    const r = parseBox(text);
    if (r.matched.length + r.unmatched.length === 0) {
      setResult({ empty: true });
      return;
    }
    setResult(r);
  };

  if (result && !result.empty) {
    return (
      <div className="paste-zone">
        <h3>Found in your box:</h3>
        <div className="chip-row">
          {result.matched.map((n) => (
            <span key={n} className="ing-chip known">
              {n}
            </span>
          ))}
          {result.unmatched.map((n) => (
            <span key={n} className="ing-chip unknown" title="No pairing data yet">
              {n}?
            </span>
          ))}
        </div>
        <div className="paste-actions">
          <button onClick={() => onParsed([...result.matched, ...result.unmatched])}>
            Start the puzzle →
          </button>
          <button className="ghost" onClick={() => setResult(null)}>
            re-paste
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="paste-zone">
      <p className="paste-hint">
        Paste the CSA email (or just a list of what&apos;s in the box) and we&apos;ll pull
        out the ingredients.
      </p>
      <textarea
        placeholder={"Paste here…\n\nThis week's share: lacinato kale, rainbow carrots,\n1 bunch beets, salad mix, garlic scapes…"}
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
      />
      <div className="paste-actions">
        <button onClick={parse} disabled={!text.trim()}>
          Parse ingredients
        </button>
        {result?.empty && <span className="parse-error">Nothing edible found — is that the right email?</span>}
      </div>
    </div>
  );
}

function PairingPanel({ name, activeIdea, onUse, onAddPairing }) {
  const pairings = pairingsFor(name) ?? pairingsFor(matchIngredient(name) ?? "");
  const matches = collectionMatches(name);
  return (
    <div className="pairing-panel">
      <div className="pairing-head">
        <strong>{name}</strong>
        <button className="use-btn" onClick={() => onUse(name)}>
          + use in “{activeIdea?.title || "new idea"}”
        </button>
      </div>
      {pairings ? (
        <div className="pairing-list">
          <span className="pairing-label">pairs with</span>
          {pairings.map((p) => (
            <button
              key={p}
              className="pair-chip"
              title={`Add ${p} to the idea (goes on the shopping list if it's not in the box)`}
              onClick={() => onAddPairing(p)}
            >
              {p} +
            </button>
          ))}
        </div>
      ) : (
        <p className="pairing-none">No pairing data for this one yet — add it to an idea anyway.</p>
      )}
      {matches.length > 0 && (
        <div className="collection-matches">
          <span className="pairing-label">from your collection</span>
          {matches.map((r) => (
            <a key={r.id} href={r.url ?? "#"} target="_blank" rel="noopener noreferrer">
              {r.title}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function IdeaCard({ idea, active, box, onSelect, onRename, onNotes, onRemoveItem, onDelete }) {
  return (
    <div className={`idea-card ${active ? "active" : ""}`} onClick={() => onSelect(idea.id)}>
      <div className="idea-head">
        <input
          className="idea-title"
          value={idea.title}
          onChange={(e) => onRename(idea.id, e.target.value)}
          onClick={(e) => e.stopPropagation()}
        />
        <button
          className="idea-delete"
          title="Delete idea"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(idea.id);
          }}
        >
          ×
        </button>
      </div>
      <div className="idea-items">
        {idea.items.length === 0 && <span className="idea-empty">tap ingredients to add them</span>}
        {idea.items.map((it) => (
          <span key={it} className={`ing-chip small ${box.includes(it) ? "from-box" : "grocery"}`}>
            {it}
            <button
              className="chip-x"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveItem(idea.id, it);
              }}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <textarea
        className="idea-notes"
        placeholder="notes — method, links, what it wants…"
        value={idea.notes}
        rows={2}
        onChange={(e) => onNotes(idea.id, e.target.value)}
        onClick={(e) => e.stopPropagation()}
      />
      {active && <div className="active-hint">selected — taps land here</div>}
    </div>
  );
}

export default function Csa() {
  const [state, setState] = useState(loadState);
  const [activeId, setActiveId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [extraInput, setExtraInput] = useState("");

  useEffect(() => {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  }, [state]);

  const { box, ideas } = state;
  const activeIdea = ideas.find((i) => i.id === activeId) ?? ideas[0] ?? null;

  const usedInIdeas = useMemo(() => new Set(ideas.flatMap((i) => i.items)), [ideas]);

  // Shopping list: everything in ideas that didn't come in the box
  const shopping = useMemo(() => {
    const list = new Map();
    for (const idea of ideas) {
      for (const it of idea.items) {
        if (box.includes(it)) continue;
        if (!list.has(it)) list.set(it, []);
        list.get(it).push(idea.title);
      }
    }
    return [...list.entries()];
  }, [ideas, box]);

  const mutateIdeas = (fn) => setState((s) => ({ ...s, ideas: fn(s.ideas) }));

  const addIdea = (firstItem) => {
    const idea = {
      id: newId(),
      title: `Idea ${ideas.length + 1}`,
      items: firstItem ? [firstItem] : [],
      notes: "",
    };
    mutateIdeas((list) => [...list, idea]);
    setActiveId(idea.id);
    return idea;
  };

  const addToActive = (item) => {
    const target = activeIdea ?? addIdea();
    mutateIdeas((list) =>
      list.map((i) =>
        i.id === target.id && !i.items.includes(item) ? { ...i, items: [...i.items, item] } : i
      )
    );
    if (!activeId) setActiveId(target.id);
  };

  const removeItem = (ideaId, item) =>
    mutateIdeas((list) =>
      list.map((i) => (i.id === ideaId ? { ...i, items: i.items.filter((x) => x !== item) } : i))
    );

  const addExtraToBox = () => {
    const name = extraInput.trim().toLowerCase();
    if (!name || box.includes(name)) return;
    setState((s) => ({ ...s, box: [...s.box, name] }));
    setExtraInput("");
  };

  const resetAll = () => {
    if (!window.confirm("Clear the box and all ideas?")) return;
    setState({ box: [], ideas: [] });
    setSelected(null);
    setActiveId(null);
  };

  return (
    <div className="app csa">
      <header>
        <h1>
          <a href="#/" className="home-link">
            🔥
          </a>{" "}
          CSA Puzzle
        </h1>
        {box.length > 0 && (
          <button className="ghost reset-btn" onClick={resetAll}>
            new week
          </button>
        )}
        <a href="#/" className="back-link">
          ← recipes
        </a>
      </header>

      {box.length === 0 ? (
        <PasteZone onParsed={(items) => setState({ box: items, ideas: [] })} />
      ) : (
        <>
          <section className="box-section">
            <h2>In the box</h2>
            <div className="chip-row">
              {box.map((n) => (
                <button
                  key={n}
                  className={`ing-chip known selectable ${selected === n ? "selected" : ""} ${
                    usedInIdeas.has(n) ? "used" : ""
                  }`}
                  onClick={() => setSelected(selected === n ? null : n)}
                >
                  {usedInIdeas.has(n) && "✓ "}
                  {n}
                </button>
              ))}
              <span className="add-extra">
                <input
                  placeholder="+ add item"
                  value={extraInput}
                  onChange={(e) => setExtraInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addExtraToBox()}
                />
              </span>
            </div>
            {selected && (
              <PairingPanel
                name={selected}
                activeIdea={activeIdea}
                onUse={addToActive}
                onAddPairing={addToActive}
              />
            )}
          </section>

          <section className="ideas-section">
            <div className="ideas-head">
              <h2>Recipe ideas</h2>
              <button className="ghost" onClick={() => addIdea()}>
                + new idea
              </button>
            </div>
            <div className="idea-grid">
              {ideas.map((idea) => (
                <IdeaCard
                  key={idea.id}
                  idea={idea}
                  active={activeIdea?.id === idea.id}
                  box={box}
                  onSelect={setActiveId}
                  onRename={(id, title) =>
                    mutateIdeas((l) => l.map((i) => (i.id === id ? { ...i, title } : i)))
                  }
                  onNotes={(id, notes) =>
                    mutateIdeas((l) => l.map((i) => (i.id === id ? { ...i, notes } : i)))
                  }
                  onRemoveItem={removeItem}
                  onDelete={(id) => {
                    mutateIdeas((l) => l.filter((i) => i.id !== id));
                    if (activeId === id) setActiveId(null);
                  }}
                />
              ))}
              {ideas.length === 0 && (
                <p className="no-ideas">
                  Tap an ingredient above, then “use in idea” — or start from a pairing that
                  sounds good.
                </p>
              )}
            </div>
          </section>

          {shopping.length > 0 && (
            <section className="shopping-section">
              <h2>Shopping list</h2>
              <ul className="shopping-list">
                {shopping.map(([item, forIdeas]) => (
                  <li key={item}>
                    <span className="shop-item">{item}</span>
                    <span className="shop-for">for {forIdeas.join(", ")}</span>
                  </li>
                ))}
              </ul>
              <button
                className="ghost copy-btn"
                onClick={() => navigator.clipboard?.writeText(shopping.map(([i]) => i).join("\n"))}
              >
                copy list
              </button>
            </section>
          )}
        </>
      )}
    </div>
  );
}
