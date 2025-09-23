import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { PanelHeader } from './panel-header';
import { AlgoliaLogo, UpIcon } from './icons';

export interface SidepanelProps {
  /** Content rendered inside the sidepanel */
  children?: React.ReactNode;
  /** Optional controlled open state */
  open?: boolean;
  /** Default open state when uncontrolled */
  defaultOpen?: boolean;
  /** Called when user toggles the panel */
  onOpenChange?: (open: boolean) => void;
  /** The selector of the element to push when panel opens (defaults to 'body > #root' fallback to 'body') */
  pushSelector?: string;
  /** Width of the sidepanel (px or any CSS width) */
  width?: string | number;
  /** Width when expanded */
  expandedWidth?: string | number;
  /** Label for the trigger button */
  buttonLabel?: string;
  /** Optional className for root wrapper */
  className?: string;
}

function useControllableState<T>({ value, defaultValue, onChange }: { value?: T; defaultValue: T; onChange?: (v: T) => void; }) {
  const [internal, setInternal] = useState<T>(defaultValue);
  const isControlled = value !== undefined;
  const state = isControlled ? (value as T) : internal;
  const setState = (v: T) => {
    if (!isControlled) setInternal(v);
    onChange?.(v);
  };
  return [state, setState] as const;
}

export function Sidepanel(props: SidepanelProps) {
  const [isOpen, setIsOpen] = useControllableState<boolean>({
    value: props.open,
    defaultValue: props.defaultOpen ?? false,
    onChange: props.onOpenChange,
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const [prompt, setPrompt] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const suggestions = useMemo(
    () => [
      'Show me the latest SDK release notes',
      'List all error codes and what they mean',
      'How do I authenticate with the API?',
      'Walk me through adding a custom integration.',
    ],
    []
  );

  const baseWidth = useMemo(() => typeof props.width === 'number' ? `${props.width}px` : (props.width ?? '480px'), [props.width]);
  const expandedWidth = useMemo(() => typeof props.expandedWidth === 'number' ? `${props.expandedWidth}px` : (props.expandedWidth ?? '640px'), [props.expandedWidth]);
  const widthCss = isExpanded ? expandedWidth : baseWidth;

  const resolvedSelector = useMemo(() => props.pushSelector ?? '#root, main, .app, body', [props.pushSelector]);
  const targetRef = useRef<HTMLElement | null>(null);
  const lastSelectorRef = useRef<string | null>(null);

  // Resolve and cache target, apply transition once, and update margin on state changes
  useLayoutEffect(() => {
    if (lastSelectorRef.current !== resolvedSelector) {
      if (targetRef.current) {
        targetRef.current.style.marginRight = '';
        targetRef.current.style.transition = '';
      }

      const candidates = Array.from(document.querySelectorAll(resolvedSelector));
      const nextTarget: HTMLElement | null = (candidates[0] as HTMLElement) || document.body;
      targetRef.current = nextTarget;
      lastSelectorRef.current = resolvedSelector;

      if (targetRef.current) {
        targetRef.current.style.transition = 'margin-right 280ms cubic-bezier(0.22, 1, 0.36, 1)';
      }
    }

    const target = targetRef.current;
    if (!target) return;

    target.style.marginRight = isOpen ? widthCss : '0px';
  }, [resolvedSelector, isOpen, widthCss]);

  // Cleanup on unmount
  useLayoutEffect(() => {
    return () => {
      if (targetRef.current) {
        targetRef.current.style.marginRight = '';
        targetRef.current.style.transition = '';
      }
    };
  }, []);

  const handleSend = () => {
    const value = prompt.trim();
    if (!value) return;
    // Placeholder for integration
    // eslint-disable-next-line no-console
    console.log('[Sidepanel] submit:', value);
    setPrompt('');
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestion = (text: string) => {
    setPrompt(text);
    setTimeout(handleSend, 0);
  };

  return (
    <div className={`sp-root ${props.className || ''}`.trim()}>
      <button
        type="button"
        className="sp-trigger-button"
        aria-expanded={isOpen}
        aria-controls="sp-panel"
        onClick={() => setIsOpen(!isOpen)}
      >
        {props.buttonLabel ?? 'Open Panel'}
      </button>

      <aside
        id="sp-panel"
        className={`sp-panel ${isOpen ? 'is-open' : ''} ${isExpanded ? 'is-expanded' : ''}`}
        style={{ width: widthCss }}
        aria-hidden={!isOpen}
      >
        <PanelHeader
          title="Ask AI"
          expanded={isExpanded}
          onToggleExpand={() => setIsExpanded((v) => !v)}
          onClose={() => setIsOpen(false)}
        />
        <div className="sp-content">
          <div className="sp-scroll" role="region" aria-label="Suggestions">
            <h2 className="sp-hero-title">How can I help you today?</h2>
            <p className="sp-hero-sub">I search through your documentation to help you find setup guides, feature details and troubleshooting tips, fast.</p>

            <div className="sp-suggestions">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="sp-suggestion"
                  onClick={() => handleSuggestion(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="sp-prompt" role="group" aria-label="Ask a question">
            <form
              className="sp-prompt-form"
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
            >
              <textarea
                ref={textareaRef}
                className="sp-textarea"
                placeholder="Ask a question"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={2}
                aria-label="Prompt input"
              />
              <button type="submit" className="sp-send-btn" disabled={!prompt.trim()} aria-label="Send">
                <UpIcon size={16} />
              </button>
            </form>
            <div className="sp-footer">
              <span className="sp-footer-note">Answers are generated using AI and may make mistakes.</span>
              <span className="sp-powered-by" aria-label="Powered by Algolia">
                <span>Powered by</span>
                <AlgoliaLogo size={80} />
              </span>
            </div>
          </div>
        </div>
      </aside>
      {isOpen && <div className="sp-backdrop" onClick={() => setIsOpen(false)} aria-hidden="true" />}
    </div>
  );
}

export default Sidepanel;


