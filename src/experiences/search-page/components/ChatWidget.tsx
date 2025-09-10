import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchBox } from 'react-instantsearch';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';

type QATurn = {
  question: string;
  answer: string;
};

function extractTextFromMessage(message: any): string {
  // Supports both legacy `content` string and new `parts` arrays
  const m: any = message as any;
  if (Array.isArray(m.parts)) {
    return m.parts
      .map((p: any) => {
        if (!p) return '';
        if (typeof p === 'string') return p;
        if (p.type === 'text') return p.text ?? '';
        // Fallback: stringify unknown part types minimally
        if (p.type && p[p.type]) return String(p[p.type]);
        return '';
      })
      .join('');
  }
  if (typeof m.content === 'string') return m.content;
  if (Array.isArray(m.content)) {
    return m.content
      .map((c: any) => (typeof c === 'string' ? c : c?.text ?? ''))
      .join('');
  }
  return '';
}

function groupMessagesIntoTurns(messages: any[]): QATurn[] {
  const turns: QATurn[] = [];
  let current: QATurn | null = null;

  for (const msg of messages) {
    if (msg.role === 'user') {
      current = { question: extractTextFromMessage(msg), answer: '' };
      turns.push(current);
    } else if (msg.role === 'assistant') {
      const text = extractTextFromMessage(msg);
      if (!current) {
        current = { question: '', answer: text };
        turns.push(current);
      } else {
        current.answer += text;
      }
    }
  }

  return turns;
}

export function ChatWidget() {
  // keep reading the instantsearch query; we trigger send on Enter
  const { query, refine } = useSearchBox();

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: 'https://askai.algolia.com/chat',
    }),
  });

  const [lastSentQuery, setLastSentQuery] = useState('');

  const qaTurns = useMemo(() => groupMessagesIntoTurns(messages as any[]), [messages]);

  const copyText = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch { }
  }, []);

  // Listen for Enter key presses on the page to submit the current search query
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && query && query.trim() !== lastSentQuery) {
        const trimmedQuery = query.trim();
        if (trimmedQuery) {
          sendMessage({ text: trimmedQuery });
          setLastSentQuery(trimmedQuery);
          refine("");
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [query, lastSentQuery, sendMessage]);

  const isGenerating = status === 'submitted' || status === 'streaming';

  return (
    <div className="qs-chat-root">
      {error && <div className="qs-error-banner">{error.message}</div>}

      <div className="qs-qa-list">
        {qaTurns.length === 0 && (
          <div className="qs-hint">
            <p>Answers are generated with AI which can make mistakes. Verify responses.</p>
          </div>
        )}

        {qaTurns.map((turn, i) => (
          <article key={i} className="qs-qa-card">
            <header className="qs-qa-header">
              <div className="qs-qa-label">Q</div>
              <div className="qs-qa-question">{turn.question}</div>
            </header>

            <section className="qs-qa-answer">
              <div className="qs-qa-label">A</div>
              <div className="qs-qa-answer-content">
                {turn.answer ? (
                  <div className="qs-qa-markdown">{turn.answer}</div>
                ) : (
                  <div className="qs-qa-generating">{isGenerating ? '…' : ''}</div>
                )}

                <div className="qs-qa-sources">
                  <span className="qs-qa-sources-title">Sources</span>
                  <ul className="qs-qa-sources-list">
                    <li className="qs-qa-source-pill">example.com</li>
                    <li className="qs-qa-source-pill">docs.example</li>
                    <li className="qs-qa-source-pill">wikipedia.org</li>
                  </ul>
                </div>
              </div>
            </section>

            <footer className="qs-qa-actions">
              <button
                className="qs-qa-action-btn"
                onClick={() => copyText(`${turn.question}\n\n${turn.answer}`)}
              >
                Copy
              </button>
              <button className="qs-qa-action-btn" disabled>
                Export
              </button>
              <button className="qs-qa-action-btn" disabled>
                Rewrite
              </button>
            </footer>
          </article>
        ))}

        {isGenerating && qaTurns.length > 0 && (
          <article className="qs-qa-card qs-qa-card-generating">
            <header className="qs-qa-header">
              <div className="qs-qa-label">Q</div>
              <div className="qs-qa-question">{qaTurns[qaTurns.length - 1]?.question}</div>
            </header>
            <section className="qs-qa-answer">
              <div className="qs-qa-label">A</div>
              <div className="qs-qa-answer-content">
                <div className="qs-qa-generating">…</div>
              </div>
            </section>
          </article>
        )}
      </div>
    </div>
  );
}
