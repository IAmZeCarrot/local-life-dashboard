import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createItem,
  dueState,
  emptyData,
  loadData,
  matches,
  parseImport,
  saveData,
  STORAGE_KEY,
} from "../src/data";

beforeEach(() => vi.stubGlobal("crypto", { randomUUID: () => "test-id" }));

describe("local data", () => {
  it("round trips through storage", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    };
    const data = emptyData();
    saveData(storage, data);
    expect(values.has(STORAGE_KEY)).toBe(true);
    expect(loadData(storage)).toEqual(data);
  });

  it("validates imports and rejects duplicate IDs", () => {
    const item = createItem(
      { kind: "note", title: "One" },
      new Date("2026-01-01T00:00:00Z"),
    );
    expect(() =>
      parseImport(JSON.stringify({ version: 1, items: [item, item] })),
    ).toThrow("Duplicate");
    expect(() => parseImport('{"version":2,"items":[]}')).toThrow(
      "not a supported",
    );
  });

  it("normalizes item input and supports search", () => {
    const item = createItem({
      kind: "bookmark",
      title: "  Garden guide  ",
      tags: "home, spring",
      url: " https://example.com ",
    });
    expect(item.title).toBe("Garden guide");
    expect(item.tags).toEqual(["home", "spring"]);
    expect(matches(item, "SPRING")).toBe(true);
    expect(matches(item, "missing")).toBe(false);
  });

  it("classifies due dates", () => {
    const item = createItem(
      { kind: "reminder", title: "Call", dueAt: "2026-01-01T12:00:00Z" },
      new Date("2026-01-01T00:00:00Z"),
    );
    expect(dueState(item, new Date("2026-01-01T11:00:00Z"))).toBe("upcoming");
    expect(dueState(item, new Date("2026-01-02T00:00:00Z"))).toBe("overdue");
    expect(
      dueState({ ...item, completed: true }, new Date("2026-01-02T00:00:00Z")),
    ).toBe("none");
  });
});
