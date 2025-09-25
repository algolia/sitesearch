import type React from "react";
import { forwardRef, useEffect, useMemo, useRef, useState } from "react";

export interface PromptTextareaProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown?: React.KeyboardEventHandler<HTMLTextAreaElement>;
  rows?: number;
  className?: string;
  ariaLabel?: string;
  /** Fallback placeholder when not animating */
  basePlaceholder?: string;
  /** Suggestions to cycle through in placeholder typing animation */
  suggestions?: string[];
  /** When true, stop animation and show post-conversation placeholder */
  hasMessages?: boolean;
  /** Placeholder to show once a conversation has started */
  postConversationPlaceholder?: string;
}

export const PromptTextarea = forwardRef<
  HTMLTextAreaElement,
  PromptTextareaProps
>(function PromptTextarea(
  {
    value,
    onChange,
    onKeyDown,
    rows = 2,
    className,
    ariaLabel = "Prompt input",
    basePlaceholder = "Ask a question",
    suggestions,
    hasMessages = false,
    postConversationPlaceholder = "Ask AI another question",
  },
  ref,
) {
  const [placeholderText, setPlaceholderText] =
    useState<string>(basePlaceholder);
  const typingTimeoutRef = useRef<number | null>(null);

  const items = useMemo(() => {
    return Array.isArray(suggestions) && suggestions.length > 0
      ? suggestions
      : [];
  }, [suggestions]);

  useEffect(() => {
    // If there are messages, switch to static post-conversation placeholder
    if (hasMessages) {
      setPlaceholderText(postConversationPlaceholder);
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      return;
    }

    // Stop animation if user is typing or there are no suggestions
    if (value.trim().length > 0 || items.length === 0) {
      setPlaceholderText(basePlaceholder);
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      return;
    }

    let isActive = true;
    let suggestionIndex = 0;
    let charIndex = 0;
    let deleting = false;

    const type = () => {
      if (!isActive) return;
      const current = items[suggestionIndex % items.length] || "";
      const next = current.slice(0, charIndex);
      setPlaceholderText(next || basePlaceholder);

      if (!deleting) {
        if (charIndex < current.length) {
          charIndex += 1;
          typingTimeoutRef.current = window.setTimeout(type, 55);
        } else {
          // pause at full string
          typingTimeoutRef.current = window.setTimeout(() => {
            deleting = true;
            type();
          }, 1200);
        }
      } else {
        if (charIndex > 0) {
          charIndex -= 1;
          typingTimeoutRef.current = window.setTimeout(type, 30);
        } else {
          deleting = false;
          suggestionIndex += 1;
          typingTimeoutRef.current = window.setTimeout(type, 500);
        }
      }
    };

    type();

    return () => {
      isActive = false;
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    };
  }, [items, value, basePlaceholder, hasMessages, postConversationPlaceholder]);

  return (
    <textarea
      ref={ref}
      className={className}
      placeholder={placeholderText}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      rows={rows}
      aria-label={ariaLabel}
    />
  );
});

export default PromptTextarea;
