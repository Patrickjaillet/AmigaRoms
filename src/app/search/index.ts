import MiniSearch from "minisearch";
import type { RomEntry } from "../../types/rom.js";

export interface RomSearchIndex {
  search(query: string): readonly RomEntry[];
  addAll(entries: readonly RomEntry[]): void;
}

const SEARCH_FIELDS = ["title", "platform", "fileName"] as const;

interface IndexedRomEntry {
  readonly id: string;
  readonly title: string;
  readonly platform: string;
  readonly fileName: string;
}

export function createSearchIndex(entries: readonly RomEntry[] = []): RomSearchIndex {
  const miniSearch = new MiniSearch<IndexedRomEntry>({
    idField: "id",
    fields: [...SEARCH_FIELDS],
    searchOptions: {
      prefix: true,
      fuzzy: 0.2,
      boost: { title: 2 },
    },
  });

  const entriesById = new Map<string, RomEntry>();

  function index(newEntries: readonly RomEntry[]): void {
    const indexable: IndexedRomEntry[] = [];
    for (const entry of newEntries) {
      entriesById.set(entry.id, entry);
      indexable.push({
        id: entry.id,
        title: entry.title,
        platform: entry.platform,
        fileName: entry.fileName,
      });
    }
    miniSearch.addAll(indexable);
  }

  index(entries);

  return {
    search(query: string): readonly RomEntry[] {
      if (query.trim().length === 0) {
        return [];
      }
      const results: RomEntry[] = [];
      for (const result of miniSearch.search(query)) {
        const entry = entriesById.get(String(result.id));
        if (entry) {
          results.push(entry);
        }
      }
      return results;
    },
    addAll: index,
  };
}
