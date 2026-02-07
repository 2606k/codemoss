import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getVersion } from "@tauri-apps/api/app";
import type { AppMode } from "../../../types";
import { KanbanModeToggle } from "../../kanban/components/KanbanModeToggle";

type SidebarHeaderProps = {
  onSelectHome: () => void;
  onAddWorkspace: () => void;
  onToggleSearch: () => void;
  isSearchOpen: boolean;
  appMode: AppMode;
  onAppModeChange: (mode: AppMode) => void;
};

function useAppVersion() {
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const fetchVersion = async () => {
      try {
        const value = await getVersion();
        if (active) {
          setVersion(value);
        }
      } catch {
        if (active) {
          setVersion(null);
        }
      }
    };
    void fetchVersion();
    return () => {
      active = false;
    };
  }, []);

  return version;
}

export function SidebarHeader({
  onSelectHome,
  onAddWorkspace: _onAddWorkspace,
  onToggleSearch: _onToggleSearch,
  isSearchOpen: _isSearchOpen,
  appMode,
  onAppModeChange,
}: SidebarHeaderProps) {
  const { t } = useTranslation();

  const version = useAppVersion();

  return (
    <div className="sidebar-header">
      <button
        className="subtitle subtitle-button sidebar-title-button"
        onClick={onSelectHome}
        data-tauri-drag-region="false"
        aria-label={t("sidebar.openHome")}
      >
        CodeMoss
      </button>
      <div className="sidebar-header-actions">
        <KanbanModeToggle
          appMode={appMode}
          onAppModeChange={onAppModeChange}
        />
        {version && (
          <span className="sidebar-version" title={`Version ${version}`}>
            v{version}
          </span>
        )}
      </div>
    </div>
  );
}
