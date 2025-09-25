import { useEffect, useState } from "react";
import {
  CloseIcon,
  ExpandIcon,
  HistoryIcon,
  MoreActionsIcon,
  NewConversationIcon,
  SparklesIcon,
} from "./icons";

interface PanelHeaderProps {
  title?: string;
  expanded: boolean;
  onToggleExpand: () => void;
  onClose: () => void;
  onStartNewConversation?: () => void;
  onOpenHistory?: () => void;
}

export function PanelHeader({
  title = "Ask AI",
  expanded,
  onToggleExpand,
  onClose,
  onStartNewConversation,
  onOpenHistory,
}: PanelHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        !target.closest?.(".sp-header-menu") &&
        !target.closest?.(".sp-header-btn")
      ) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen]);

  return (
    <div className="sp-header">
      <div className="sp-header-left">
        <SparklesIcon size={16} color="var(--sp-primary)" />
        <h3 className="sp-header-title">{title}</h3>
      </div>
      <div className="sp-header-buttons">
        <div className="sp-header-menu-root">
          <button
            className="sp-header-btn"
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="More actions"
            title="More actions"
          >
            <MoreActionsIcon size={16} />
          </button>
          {menuOpen && (
            <div role="menu" className="sp-header-menu">
              <button
                className="sp-header-menu-item"
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onStartNewConversation?.();
                }}
                role="menuitem"
              >
                <NewConversationIcon size={16} />
                Start a new conversation
              </button>
              {/* <button
                className="sp-header-menu-item"
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onOpenHistory?.();
                }}
                role="menuitem"
              >
                <HistoryIcon size={16} />
                Conversation history
              </button> */}
            </div>
          )}
        </div>
        <button
          type="button"
          className="sp-header-btn"
          onClick={onToggleExpand}
          aria-label="Expand"
          title="Expand"
        >
          <ExpandIcon
            size={16}
            color={expanded ? "var(--sp-primary)" : "currentColor"}
          />
        </button>
        <button
          type="button"
          className="sp-header-btn"
          onClick={onClose}
          aria-label="Close"
          title="Close"
        >
          <CloseIcon size={16} />
        </button>
      </div>
    </div>
  );
}
