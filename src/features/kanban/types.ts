import type { EngineType } from "../../types";

export type KanbanTaskStatus =
  | "todo"
  | "inprogress"
  | "testing"
  | "done"
  | "cancelled";

export type KanbanColumnDef = {
  id: KanbanTaskStatus;
  labelKey: string;
  color: string;
};

export type KanbanTask = {
  id: string;
  workspaceId: string;
  title: string;
  description: string;
  status: KanbanTaskStatus;
  engineType: EngineType;
  modelId: string | null;
  branchName: string;
  images: string[];
  autoStart: boolean;
  sortOrder: number;
  threadId: string | null;
  createdAt: number;
  updatedAt: number;
};

export type KanbanViewState =
  | { view: "projects" }
  | { view: "board"; workspaceId: string };

export type KanbanStoreData = {
  tasks: KanbanTask[];
};
