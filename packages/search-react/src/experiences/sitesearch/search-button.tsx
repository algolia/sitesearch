import React from 'react';
import { SearchIcon } from './icons';

interface SearchButtonProps {
  onClick: () => void;
}

export const SearchButton: React.FC<SearchButtonProps> = ({ onClick }) => {
  return (
    <button
      className="sitesearch-button"
      onClick={onClick}
      aria-label="Open search"
    >
      <span className="search-icon"><SearchIcon /></span>
      <span className="button-text">Search</span>
      <span className="keyboard-shortcut">⌘ K</span>
    </button>
  );
};