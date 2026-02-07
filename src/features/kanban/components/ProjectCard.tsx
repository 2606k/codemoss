import { useTranslation } from "react-i18next";
import { FolderOpen } from "lucide-react";
import type { WorkspaceInfo } from "../../../types";

type ProjectCardProps = {
  workspace: WorkspaceInfo;
  taskCount: number;
  onSelect: () => void;
};

export function ProjectCard({
  workspace,
  taskCount,
  onSelect,
}: ProjectCardProps) {
  const { t } = useTranslation();

  return (
    <div className="kanban-project-card" onClick={onSelect}>
      <div className="kanban-project-card-header">
        <FolderOpen size={18} className="kanban-project-card-icon" />
        <span className="kanban-project-card-name">{workspace.name}</span>
      </div>
      <div className="kanban-project-card-footer">
        <span className="kanban-project-card-path" title={workspace.path}>
          {workspace.path}
        </span>
        {taskCount > 0 && (
          <span className="kanban-project-card-count">
            {t("kanban.projects.taskCount", { count: taskCount })}
          </span>
        )}
      </div>
    </div>
  );
}
