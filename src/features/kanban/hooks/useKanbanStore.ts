import { useCallback, useEffect, useRef, useState } from "react";
import type {
  KanbanTask,
  KanbanTaskStatus,
  KanbanStoreData,
  KanbanViewState,
} from "../types";
import type { EngineType } from "../../../types";
import { loadKanbanData, saveKanbanData } from "../utils/kanbanStorage";
import { generateKanbanId } from "../utils/kanbanId";

type CreateTaskInput = {
  workspaceId: string;
  title: string;
  description: string;
  engineType: EngineType;
  modelId: string | null;
  branchName: string;
  images: string[];
  autoStart: boolean;
};

export function useKanbanStore() {
  const [store, setStore] = useState<KanbanStoreData>(() => loadKanbanData());
  const [viewState, setViewState] = useState<KanbanViewState>({
    view: "projects",
  });

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveKanbanData(store);
    }, 300);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [store]);

  // --- Task CRUD ---

  const createTask = useCallback((input: CreateTaskInput): KanbanTask => {
    const now = Date.now();
    const task: KanbanTask = {
      id: generateKanbanId(),
      workspaceId: input.workspaceId,
      title: input.title,
      description: input.description,
      status: input.autoStart ? "inprogress" : "todo",
      engineType: input.engineType,
      modelId: input.modelId,
      branchName: input.branchName,
      images: input.images,
      autoStart: input.autoStart,
      sortOrder: now,
      threadId: null,
      createdAt: now,
      updatedAt: now,
    };
    setStore((prev) => ({
      ...prev,
      tasks: [...prev.tasks, task],
    }));
    return task;
  }, []);

  const updateTask = useCallback(
    (taskId: string, changes: Partial<KanbanTask>) => {
      setStore((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === taskId ? { ...t, ...changes, updatedAt: Date.now() } : t
        ),
      }));
    },
    []
  );

  const deleteTask = useCallback((taskId: string) => {
    setStore((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== taskId),
    }));
  }, []);

  const reorderTask = useCallback(
    (taskId: string, newStatus: KanbanTaskStatus, newSortOrder: number) => {
      setStore((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                status: newStatus,
                sortOrder: newSortOrder,
                updatedAt: Date.now(),
              }
            : t
        ),
      }));
    },
    []
  );

  return {
    tasks: store.tasks,
    kanbanViewState: viewState,
    setKanbanViewState: setViewState,
    createTask,
    updateTask,
    deleteTask,
    reorderTask,
  };
}
