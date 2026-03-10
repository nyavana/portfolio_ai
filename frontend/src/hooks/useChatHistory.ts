import { useState, useCallback } from 'react';
import type { ChatMessage, AskResponse } from '../types/api';
import { askQuestion } from '../api/chat';

export function useChatHistory() {
  const [messages, setMessages] = useState<readonly ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(async (question: string) => {
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: question,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setSending(true);
    setError(null);

    try {
      const res: AskResponse = await askQuestion(question);

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: res.answer,
        route: res.route,
        data: res.data,
        contexts: res.contexts,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(errMsg);
    } finally {
      setSending(false);
    }
  }, []);

  const clear = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, sending, error, send, clear } as const;
}
