import { useEffect, useState } from 'react';
import { getLlmConfig, updateLlmConfig, getStoredLlmConfig } from '../../api/config';
import styles from './ApiSettingsModal.module.css';

interface ApiSettingsModalProps {
  readonly isOpen: boolean;
  readonly forceOpen: boolean;
  readonly onClose: () => void;
  readonly onSaved: () => void;
}

type SubmitStatus = 'idle' | 'loading' | 'success' | 'error';

interface FormState {
  baseUrl: string;
  model: string;
  apiKey: string;
}

export function ApiSettingsModal({ isOpen, forceOpen, onClose, onSaved }: ApiSettingsModalProps) {
  const [form, setForm] = useState<FormState>({ baseUrl: '', model: '', apiKey: '' });
  const [keyHint, setKeyHint] = useState('');
  const [keyConfigured, setKeyConfigured] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const stored = getStoredLlmConfig();
    if (stored) {
      setForm({ baseUrl: stored.base_url, model: stored.model, apiKey: stored.api_key });
      setKeyConfigured(Boolean(stored.api_key));
      setKeyHint(stored.api_key.length > 6 ? stored.api_key.slice(0, 6) + '****' : '');
      return;
    }
    getLlmConfig()
      .then((cfg) => {
        setForm((prev) => ({ ...prev, baseUrl: cfg.base_url, model: cfg.model, apiKey: '' }));
        setKeyHint(cfg.api_key_hint);
        setKeyConfigured(cfg.api_key_configured);
      })
      .catch(() => {});
  }, [isOpen, forceOpen]);

  const handleBackdrop = () => {
    if (!forceOpen) onClose();
  };

  const handleSubmit = () => {
    setStatus('loading');
    setErrorMsg('');
    const body = {
      ...(form.baseUrl ? { base_url: form.baseUrl } : {}),
      ...(form.model   ? { model:    form.model   } : {}),
      ...(form.apiKey  ? { api_key:  form.apiKey  } : {}),
    };
    updateLlmConfig(body);
    setStatus('success');
    setForm((prev) => ({ ...prev, apiKey: '' }));
    setTimeout(() => {
      setStatus('idle');
      onSaved();
      if (!forceOpen) onClose();
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.backdrop} onClick={handleBackdrop}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>LLM Configuration</h2>
            {forceOpen && (
              <p className={styles.subtitle}>⚠ API key not configured — enter your settings to continue</p>
            )}
          </div>
          {!forceOpen && (
            <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
              ✕
            </button>
          )}
        </div>

        <div className={styles.fields}>
          <div className={styles.field}>
            <label className={styles.label}>Endpoint URL</label>
            <input
              className={styles.input}
              type="text"
              placeholder="http://127.0.0.1:11434/v1"
              value={form.baseUrl}
              onChange={(e) => setForm((prev) => ({ ...prev, baseUrl: e.target.value }))}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Model name</label>
            <input
              className={styles.input}
              type="text"
              placeholder="e.g. gpt-4o or llama3"
              value={form.model}
              onChange={(e) => setForm((prev) => ({ ...prev, model: e.target.value }))}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>API Key</label>
            <div className={styles.keyInputRow}>
              <input
                className={styles.input}
                type={showKey ? 'text' : 'password'}
                placeholder="Leave blank to keep current"
                value={form.apiKey}
                onChange={(e) => setForm((prev) => ({ ...prev, apiKey: e.target.value }))}
                autoComplete="off"
              />
              <button
                className={styles.revealBtn}
                type="button"
                onClick={() => setShowKey((s) => !s)}
                aria-label={showKey ? 'Hide key' : 'Show key'}
              >
                {showKey ? '◉' : '◎'}
              </button>
            </div>
            <div className={styles.currentHint}>
              {keyConfigured ? (
                <>
                  <span>{keyHint}</span>
                  <span className={styles.statusPillGreen}>configured</span>
                </>
              ) : (
                <span className={styles.statusPillAmber}>not configured</span>
              )}
            </div>
          </div>
        </div>

        {status === 'error' && <div className={styles.errorBar}>{errorMsg}</div>}
        {status === 'success' && <div className={styles.successBar}>Settings saved successfully</div>}

        <div className={styles.actions}>
          {!forceOpen && (
            <button className={styles.btnSecondary} onClick={onClose}>
              Cancel
            </button>
          )}
          <button
            className={styles.btnPrimary}
            onClick={handleSubmit}
            disabled={status === 'loading' || status === 'success'}
          >
            {status === 'loading' ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
