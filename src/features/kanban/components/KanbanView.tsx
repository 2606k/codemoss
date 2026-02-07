import type { ReactNode } from "react";
import type { AppMode, EngineStatus, EngineType, WorkspaceInfo } from "../../../types";
import type {
  KanbanTask,
  KanbanTaskStatus,
  KanbanViewState,
} from "../types";
import { ProjectList } from "./ProjectList";
import { KanbanBoard } from "./KanbanBoard";
import { KANBAN_COLUMNS } from "../constants";

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

type KanbanViewProps = {
  viewState: KanbanViewState;
  onViewStateChange: (state: KanbanViewState) => void;
  workspaces: WorkspaceInfo[];
  tasks: KanbanTask[];
  onCreateTask: (input: CreateTaskInput) => KanbanTask;
  onUpdateTask: (taskId: string, changes: Partial<KanbanTask>) => void;
  onDeleteTask: (taskId: string) => void;
  onReorderTask: (
    taskId: string,
    newStatus: KanbanTaskStatus,
    newSortOrder: number
  ) => void;
  onAddWorkspace: () => void;
  onAppModeChange: (mode: AppMode) => void;
  engineStatuses: EngineStatus[];
  conversationNode: ReactNode | null;
  selectedTaskId: string | null;
  taskProcessingMap: Record<string, boolean>;
  onOpenTaskConversation: (task: KanbanTask) => void;
  onCloseTaskConversation: () => void;
  onDragToInProgress: (task: KanbanTask) => void;
};

export function KanbanView({
  viewState,
  onViewStateChange,
  workspaces,
  tasks,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  onReorderTask,
  onAddWorkspace,
  onAppModeChange,
  engineStatuses,
  conversationNode,
  selectedTaskId,
  taskProcessingMap,
  onOpenTaskConversation,
  onCloseTaskConversation,
  onDragToInProgress,
}: KanbanViewProps) {
  if (viewState.view === "board") {
    const workspace = workspaces.find((w) => w.id === viewState.workspaceId);
    if (!workspace) {
      onViewStateChange({ view: "projects" });
      return null;
    }
    const workspaceTasks = tasks.filter(
      (t) => t.workspaceId === viewState.workspaceId
    );
    return (
      <KanbanBoard
        workspace={workspace}
        tasks={workspaceTasks}
        columns={KANBAN_COLUMNS}
        onBack={() => {
          onCloseTaskConversation();
          onViewStateChange({ view: "projects" });
        }}
        onCreateTask={onCreateTask}
        onUpdateTask={onUpdateTask}
        onDeleteTask={onDeleteTask}
        onReorderTask={onReorderTask}
        onAppModeChange={onAppModeChange}
        engineStatuses={engineStatuses}
        conversationNode={conversationNode}
        selectedTaskId={selectedTaskId}
        taskProcessingMap={taskProcessingMap}
        onSelectTask={onOpenTaskConversation}
        onCloseConversation={onCloseTaskConversation}
        onDragToInProgress={onDragToInProgress}
      />
    );
  }

  return (
    <ProjectList
      workspaces={workspaces}
      tasks={tasks}
      onSelectWorkspace={(workspaceId) =>
        onViewStateChange({ view: "board", workspaceId })
      }
      onAddWorkspace={onAddWorkspace}
      onAppModeChange={onAppModeChange}
    />
  );
}
