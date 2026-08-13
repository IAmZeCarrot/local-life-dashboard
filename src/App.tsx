import { useEffect, useMemo, useRef, useState } from "react";
import {
  createItem,
  dueState,
  loadData,
  matches,
  parseImport,
  saveData,
} from "./data";
import type { DashboardData, Filter, Item, Kind } from "./types";
import "./styles.css";

const filters: { value: Filter; label: string }[] = [
  { value: "all", label: "Everything" },
  { value: "task", label: "Tasks" },
  { value: "note", label: "Notes" },
  { value: "bookmark", label: "Bookmarks" },
  { value: "reminder", label: "Reminders" },
];

export default function App() {
  const [data, setData] = useState<DashboardData>(() => loadData(localStorage));
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [showForm, setShowForm] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => saveData(localStorage, data), [data]);

  const visible = useMemo(
    () =>
      data.items.filter(
        (item) =>
          (filter === "all" || item.kind === filter) && matches(item, query),
      ),
    [data.items, filter, query],
  );
  const activeTasks = data.items.filter(
    (item) => item.kind === "task" && !item.completed,
  ).length;
  const dueSoon = data.items.filter((item) => dueState(item) !== "none").length;

  function add(item: Item) {
    setData((current) => ({ ...current, items: [item, ...current.items] }));
    setShowForm(false);
    setNotice(`${item.kind} saved locally.`);
  }

  function update(id: string, change: Partial<Item>) {
    setData((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.id === id
          ? { ...item, ...change, updatedAt: new Date().toISOString() }
          : item,
      ),
    }));
  }

  function remove(id: string) {
    if (!confirm("Remove this item from this device?")) return;
    setData((current) => ({
      ...current,
      items: current.items.filter((item) => item.id !== id),
    }));
    setNotice("Item removed.");
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `local-life-dashboard-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setNotice("Export downloaded.");
  }

  async function importData(file: File) {
    try {
      const imported = parseImport(await file.text());
      if (
        !confirm(
          `Replace local data with ${imported.items.length} imported item(s)?`,
        )
      )
        return;
      setData(imported);
      setNotice("Import complete.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Import failed.");
    } finally {
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  return (
    <div className="app-shell">
      <header className="masthead">
        <div>
          <p className="eyebrow">Private by design · saved on this device</p>
          <h1>Make room for the day.</h1>
          <p className="intro">
            A calm, offline home for the loose ends worth remembering.
          </p>
        </div>
        <button className="primary" onClick={() => setShowForm(true)}>
          + Add something
        </button>
      </header>

      <main id="main-content">
        <section className="status-grid" aria-label="Dashboard summary">
          <article>
            <strong>{activeTasks}</strong>
            <span>open tasks</span>
          </article>
          <article>
            <strong>{dueSoon}</strong>
            <span>need attention</span>
          </article>
          <article>
            <strong>{data.items.length}</strong>
            <span>items saved</span>
          </article>
        </section>

        <section className="workspace">
          <div className="toolbar">
            <label className="search">
              <span>Search</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search titles, notes, tags…"
              />
            </label>
            <div className="data-actions">
              <button onClick={exportData}>Export</button>
              <button onClick={() => fileInput.current?.click()}>Import</button>
              <input
                ref={fileInput}
                hidden
                type="file"
                accept="application/json,.json"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void importData(file);
                }}
              />
            </div>
          </div>

          <nav className="filters" aria-label="Filter items">
            {filters.map((item) => (
              <button
                key={item.value}
                aria-pressed={filter === item.value}
                onClick={() => setFilter(item.value)}
              >
                {item.label}
                <span>
                  {item.value === "all"
                    ? data.items.length
                    : data.items.filter((entry) => entry.kind === item.value)
                        .length}
                </span>
              </button>
            ))}
          </nav>

          <div className="items" aria-live="polite">
            {visible.length === 0 ? (
              <div className="empty">
                <p className="empty-mark">○</p>
                <h2>Nothing here yet</h2>
                <p>Add an item or adjust your search and filters.</p>
              </div>
            ) : (
              visible.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onUpdate={update}
                  onRemove={remove}
                />
              ))
            )}
          </div>
        </section>
      </main>

      {showForm && (
        <ItemForm onClose={() => setShowForm(false)} onSubmit={add} />
      )}
      <p className="notice" role="status">
        {notice}
      </p>
      <footer>Local Life Dashboard · no account, no cloud, no tracking</footer>
    </div>
  );
}

function ItemCard({
  item,
  onUpdate,
  onRemove,
}: {
  item: Item;
  onUpdate: (id: string, change: Partial<Item>) => void;
  onRemove: (id: string) => void;
}) {
  const due = dueState(item);
  return (
    <article className={`item-card ${item.completed ? "completed" : ""}`}>
      <div className="item-top">
        <span className={`kind kind-${item.kind}`}>{item.kind}</span>
        {due !== "none" && (
          <span className={`due ${due}`}>
            {due === "overdue" ? "Overdue" : "Due soon"}
          </span>
        )}
      </div>
      <h2>{item.title}</h2>
      {item.details && <p>{item.details}</p>}
      {item.url && (
        <a href={item.url} target="_blank" rel="noreferrer">
          Open bookmark <span aria-hidden="true">↗</span>
        </a>
      )}
      {item.dueAt && (
        <time dateTime={item.dueAt}>
          {new Intl.DateTimeFormat(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
          }).format(new Date(item.dueAt))}
        </time>
      )}
      {item.tags.length > 0 && (
        <ul className="tags" aria-label="Tags">
          {item.tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
      )}
      <div className="item-actions">
        {(item.kind === "task" || item.kind === "reminder") && (
          <button
            onClick={() => onUpdate(item.id, { completed: !item.completed })}
          >
            {item.completed ? "Reopen" : "Complete"}
          </button>
        )}
        <button className="danger" onClick={() => onRemove(item.id)}>
          Remove
        </button>
      </div>
    </article>
  );
}

function ItemForm({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (item: Item) => void;
}) {
  const [kind, setKind] = useState<Kind>("task");
  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-item-heading"
      >
        <button className="close" aria-label="Close" onClick={onClose}>
          ×
        </button>
        <p className="eyebrow">New local item</p>
        <h2 id="new-item-heading">What would you like to keep?</h2>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const field = (name: string): string => {
              const value = form.get(name);
              return typeof value === "string" ? value : "";
            };
            onSubmit(
              createItem({
                kind,
                title: field("title"),
                details: field("details"),
                tags: field("tags"),
                dueAt: field("dueAt"),
                url: field("url"),
              }),
            );
          }}
        >
          <label>
            Type
            <select
              value={kind}
              onChange={(event) => setKind(event.target.value as Kind)}
            >
              <option value="task">Task</option>
              <option value="note">Note</option>
              <option value="bookmark">Bookmark</option>
              <option value="reminder">Reminder</option>
            </select>
          </label>
          <label>
            Title
            <input name="title" required maxLength={120} autoFocus />
          </label>
          <label>
            Details
            <textarea name="details" rows={4} maxLength={2000} />
          </label>
          {kind === "bookmark" && (
            <label>
              Web address
              <input name="url" type="url" required placeholder="https://" />
            </label>
          )}
          {(kind === "task" || kind === "reminder") && (
            <label>
              Due date and time
              <input name="dueAt" type="datetime-local" />
            </label>
          )}
          <label>
            Tags <span>(comma separated)</span>
            <input name="tags" placeholder="home, someday" />
          </label>
          <div className="form-actions">
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="primary" type="submit">
              Save locally
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
