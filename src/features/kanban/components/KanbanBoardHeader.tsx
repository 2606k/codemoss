import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import type { AppMode, WorkspaceInfo } from "../../../types";
import { KanbanModeToggle } from "./KanbanModeToggle";

type KanbanBoardHeaderProps = {
  workspace: WorkspaceInfo;
  onBack: () => void;
  onAppModeChange: (mode: AppMode) => void;
};

export function KanbanBoardHeader({
  workspace,
  onBack,
  onAppModeChange,
}: KanbanBoardHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="kanban-board-header">
      <div className="kanban-board-header-left">
        <KanbanModeToggle appMode="kanban" onAppModeChange={onAppModeChange} />
        <button
          className="kanban-icon-btn"
          onClick={onBack}
          aria-label={t("kanban.board.back")}
        >
          <ArrowLeft size={18} />
        </button>
        <h2 className="kanban-board-title">{workspace.name}</h2>
      </div>
    </div>
  );
}
