import type { DashboardData, Item, Kind } from "./types";

export const STORAGE_KEY = "local-life-dashboard:v1";

export const emptyData = (): DashboardData => ({ version: 1, items: [] });

export function loadData(storage: Pick<Storage, "getItem">): DashboardData {
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return emptyData();
  try {
    return parseImport(raw);
  } catch {
    return emptyData();
  }
}

export function saveData(
  storage: Pick<Storage, "setItem">,
  data: DashboardData,
): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function parseImport(raw: string): DashboardData {
  const candidate: unknown = JSON.parse(raw);
  if (
    !isRecord(candidate) ||
    candidate.version !== 1 ||
    !Array.isArray(candidate.items)
  ) {
    throw new Error(
      "This file is not a supported Local Life Dashboard export.",
    );
  }
  const ids = new Set<string>();
  const items = candidate.items.map((item, index) => validateItem(item, index));
  for (const item of items) {
    if (ids.has(item.id)) throw new Error(`Duplicate item ID: ${item.id}`);
    ids.add(item.id);
  }
  return { version: 1, items };
}

function validateItem(value: unknown, index: number): Item {
  if (!isRecord(value)) throw new Error(`Item ${index + 1} is invalid.`);
  const kinds: Kind[] = ["task", "note", "bookmark", "reminder"];
  if (
    typeof value.id !== "string" ||
    !kinds.includes(value.kind as Kind) ||
    typeof value.title !== "string" ||
    typeof value.details !== "string" ||
    !Array.isArray(value.tags) ||
    !value.tags.every((tag) => typeof tag === "string") ||
    typeof value.createdAt !== "string" ||
    typeof value.updatedAt !== "string" ||
    typeof value.completed !== "boolean" ||
    !(typeof value.dueAt === "string" || value.dueAt === null) ||
    !(typeof value.url === "string" || value.url === null)
  )
    throw new Error(`Item ${index + 1} has an invalid shape.`);
  return value as Item;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function createItem(
  input: {
    kind: Kind;
    title: string;
    details?: string;
    tags?: string;
    dueAt?: string;
    url?: string;
  },
  now = new Date(),
): Item {
  const timestamp = now.toISOString();
  return {
    id: crypto.randomUUID(),
    kind: input.kind,
    title: input.title.trim(),
    details: input.details?.trim() ?? "",
    tags: (input.tags ?? "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    dueAt: input.dueAt ? new Date(input.dueAt).toISOString() : null,
    url: input.url?.trim() || null,
    completed: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function matches(item: Item, query: string): boolean {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return true;
  return [item.title, item.details, item.url ?? "", ...item.tags]
    .join(" ")
    .toLocaleLowerCase()
    .includes(normalized);
}

export function dueState(
  item: Item,
  now = new Date(),
): "none" | "upcoming" | "overdue" {
  if (!item.dueAt || item.completed) return "none";
  const due = new Date(item.dueAt);
  if (due.getTime() < now.getTime()) return "overdue";
  return due.getTime() - now.getTime() <= 86_400_000 ? "upcoming" : "none";
}
