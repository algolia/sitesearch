import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchBox } from 'react-instantsearch';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';

type QATurn = {
  question: string;
  answer: string;
};

type Message = {
  role: 'user' | 'assistant';
  content?: string | any[];
  parts?: any[];
};

function extractTextFromMessage(message: Message): string {
  if (Array.isArray(message.parts)) {
    return message.parts
      .map((p: any) => {
        if (!p) return '';
        if (typeof p === 'string') return p;
        if (p.type === 'text') return p.text ?? '';
        if (p.type && p[p.type]) return String(p[p.type]);
        return '';
      })
      .join('');
  }
  if (typeof message.content === 'string') return message.content;
  if (Array.isArray(message.content)) {
    return message.content
      .map((c: any) => (typeof c === 'string' ? c : c?.text ?? ''))
      .join('');
  }
  return '';
}

function groupMessagesIntoTurns(messages: Message[]): QATurn[] {
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

function useClipboard() {
  const copyText = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Silently fail - clipboard access might be blocked
    }
  }, []);

  return { copyText };
}

function useKeyboardListener(callback: (e: KeyboardEvent) => void, dependencies: React.DependencyList) {
  useEffect(() => {
    document.addEventListener('keydown', callback);
    return () => document.removeEventListener('keydown', callback);
  }, dependencies);
}

function useMessageTurns(messages: any[]) {
  return useMemo(() => groupMessagesIntoTurns(messages as Message[]), [messages]);
}

interface ChatWidgetProps {
  initialQuestion?: string;
}

export function ChatWidget({ initialQuestion }: ChatWidgetProps) {
  const { query, refine } = useSearchBox();
  const { copyText } = useClipboard();
  
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: 'https://beta-askai.algolia.com/chat',
    }),
  });

  const [lastSentQuery, setLastSentQuery] = useState('');
  const qaTurns = useMessageTurns(messages);

  const handleSendMessage = useCallback((text: string) => {
    const trimmed = text.trim();
    if (trimmed && trimmed !== lastSentQuery) {
      sendMessage({ text: trimmed });
      setLastSentQuery(trimmed);
      refine("");
    }
  }, [lastSentQuery, sendMessage, refine]);

  // Auto-send initial question
  useEffect(() => {
    const trimmed = (initialQuestion ?? '').trim();
    if (trimmed && trimmed !== lastSentQuery) {
      handleSendMessage(trimmed);
    }
  }, [initialQuestion, lastSentQuery, handleSendMessage]);

  // Listen for Enter key presses
  useKeyboardListener(
    useCallback((e: KeyboardEvent) => {
      if (e.key === 'Enter' && query && query.trim() !== lastSentQuery) {
        handleSendMessage(query);
      }
    }, [query, lastSentQuery, handleSendMessage]),
    [query, lastSentQuery, handleSendMessage]
  );

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
