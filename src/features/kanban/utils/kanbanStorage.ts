import { KANBAN_STORAGE_KEY } from "../constants";
import type { KanbanStoreData } from "../types";

const EMPTY_STORE: KanbanStoreData = { tasks: [] };

export function loadKanbanData(): KanbanStoreData {
  try {
    const raw = localStorage.getItem(KANBAN_STORAGE_KEY);
    if (!raw) return EMPTY_STORE;
    const parsed = JSON.parse(raw) as KanbanStoreData;
    if (!Array.isArray(parsed.tasks)) {
      return EMPTY_STORE;
    }
    return { tasks: parsed.tasks };
  } catch {
    return EMPTY_STORE;
  }
}

export function saveKanbanData(data: KanbanStoreData): void {
  try {
    localStorage.setItem(KANBAN_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save kanban data:", error);
  }
}
