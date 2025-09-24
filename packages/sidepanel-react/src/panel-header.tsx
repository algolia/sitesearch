import { CloseIcon, ExpandIcon, SparklesIcon } from './icons';

interface PanelHeaderProps {
  title?: string;
  expanded: boolean;
  onToggleExpand: () => void;
  onClose: () => void;
}

export function PanelHeader({ title = 'Ask AI', expanded, onToggleExpand, onClose }: PanelHeaderProps) {
  return (
    <div className="sp-header">
      <div className="sp-header-left">
        <SparklesIcon size={16} color='var(--sp-primary)' />
        <h3 className="sp-header-title">{title}</h3>
      </div>
      <div className="sp-header-buttons">
        <button className="sp-header-btn" onClick={onToggleExpand} aria-label="Expand">
          <ExpandIcon size={16} color={expanded ? 'var(--sp-primary)' : 'currentColor'} />
        </button>
        <button className="sp-header-btn" onClick={onClose} aria-label="Close">
          <CloseIcon size={16} />
        </button>
      </div>
    </div>
  );
}


