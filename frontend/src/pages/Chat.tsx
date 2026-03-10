import { useState, useRef, useEffect } from 'react';
import { useChatHistory } from '../hooks/useChatHistory';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { MarkdownRenderer } from '../components/common/MarkdownRenderer';
import styles from './Pages.module.css';
import commonStyles from '../components/common/Common.module.css';

export function Chat() {
  const { messages, sending, error, send, clear } = useChatHistory();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = input.trim();
    if (!q || sending) return;
    setInput('');
    send(q);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className={styles.chatLayout}>
      {/* Messages */}
      <div className={styles.chatMessages}>
        {messages.length === 0 && (
          <div className={styles.chatEmpty}>
            <h2>Ask anything about your portfolio</h2>
            <p className="text-secondary">
              Try "What are my main risk factors?" or "Summarize recent news impact"
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`${styles.chatBubble} ${
              msg.role === 'user' ? styles.chatUser : styles.chatAssistant
            } animate-message`}
          >
            {msg.role === 'assistant' && msg.route && (
              <span className={commonStyles.routeBadge}>
                {msg.route}
              </span>
            )}
            {msg.role === 'user' ? (
              <p className={styles.chatText}>{msg.content}</p>
            ) : (
              <MarkdownRenderer>{msg.content}</MarkdownRenderer>
            )}
            {msg.role === 'assistant' && msg.data != null && (
              <details className={styles.chatDetails}>
                <summary className="text-secondary">View data</summary>
                <pre className={`mono ${styles.chatPre}`}>
                  {JSON.stringify(msg.data, null, 2)}
                </pre>
              </details>
            )}
            {msg.role === 'assistant' && msg.contexts && msg.contexts.length > 0 && (
              <details className={styles.chatDetails}>
                <summary className="text-secondary">Sources</summary>
                {msg.contexts.map((ctx, i) => (
                  <div key={i} className={styles.contextItem}>
                    <p>{ctx.text}</p>
                    {ctx.metadata && (
                      <span className={`mono ${styles.contextMeta}`}>
                        {Object.entries(ctx.metadata).map(([k, v]) => `${k}: ${String(v)}`).join(' · ')}
                      </span>
                    )}
                  </div>
                ))}
              </details>
            )}
          </div>
        ))}

        {sending && (
          <div className={`${styles.chatBubble} ${styles.chatAssistant}`}>
            <div className="spinner" />
          </div>
        )}

        {error && <ErrorBanner message={error} />}

        <div ref={bottomRef} />
      </div>

      {/* Input Bar */}
      <form className={styles.chatInputBar} onSubmit={handleSubmit}>
        <textarea
          ref={inputRef}
          className={styles.chatInput}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question…"
          rows={1}
          disabled={sending}
        />
        <button
          type="submit"
          className="btn-primary"
          disabled={sending || !input.trim()}
        >
          {sending ? '…' : 'Send'}
        </button>
        {messages.length > 0 && (
          <button type="button" className="btn-ghost" onClick={clear}>
            Clear
          </button>
        )}
      </form>
    </div>
  );
}
