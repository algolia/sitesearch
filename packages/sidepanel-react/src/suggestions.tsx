import { useMemo } from "react";

export interface SuggestionsProps {
  setPrompt: (text: string) => void;
  handleSend: () => void;
  suggestions?: string[];
}

const DEFAULT_SUGGESTIONS = [
  "Show me the latest SDK release notes",
  "List all error codes and what they mean",
  "How do I authenticate with the API?",
  "Walk me through adding a custom integration.",
];

const Suggestions = ({
  setPrompt,
  handleSend,
  suggestions: external,
}: SuggestionsProps) => {
  const suggestions = useMemo(
    () => (external && external.length > 0 ? external : DEFAULT_SUGGESTIONS),
    [external],
  );
  const handleSuggestion = (text: string) => {
    setPrompt(text);
    setTimeout(handleSend, 0);
  };
  return (
    <div className="sp-suggestions">
      <h2 className="sp-hero-title">How can I help you today?</h2>
      <p className="sp-hero-sub">
        I search through your documentation to help you find setup guides,
        feature details and troubleshooting tips, fast.
      </p>

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
  );
};

export default Suggestions;
