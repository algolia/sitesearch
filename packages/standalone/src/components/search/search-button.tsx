import type { FC, ReactNode } from "react";
import { useEffect, useState } from "react";
import { SearchIcon } from "./icons";

interface SearchButtonProps {
  onClick: () => void;
  darkMode?: boolean;
  children?: ReactNode;
}

export const SearchButton: FC<SearchButtonProps> = ({ onClick, darkMode }) => {
  const [modifierLabel, setModifierLabel] = useState("⌘");
  const [isModifierPressed, setIsModifierPressed] = useState(false);
  const [isKPressed, setIsKPressed] = useState(false);

  useEffect(() => {
    if (typeof navigator === "undefined") return;
    const isMac = /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform);
    setModifierLabel(isMac ? "⌘" : "Ctrl");
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey) setIsModifierPressed(true);
      if (event.key.toLowerCase() === "k") setIsKPressed(true);
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      if (!event.metaKey && !event.ctrlKey) setIsModifierPressed(false);
      if (event.key.toLowerCase() === "k") setIsKPressed(false);
    };
    const resetKeys = () => {
      setIsModifierPressed(false);
      setIsKPressed(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", resetKeys);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", resetKeys);
    };
  }, []);

  return (
    <button
      className={`sitesearch-button${darkMode ? " dark" : ""}`}
      type="button"
      onClick={onClick}
      aria-label="Open search"
    >
      <span className="search-icon">
        <SearchIcon />
      </span>
      <span className="button-text">Search</span>
      <span className="keyboard-shortcut">
        <kbd className={isModifierPressed ? "pressed" : ""}>
          {modifierLabel}
        </kbd>
        <kbd className={isKPressed ? "pressed" : ""}>K</kbd>
      </span>
    </button>
  );
};
