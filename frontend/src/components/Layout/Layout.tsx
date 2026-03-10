import { useState, useEffect, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { ApiSettingsModal } from '../Settings/ApiSettingsModal';
import { getHealth } from '../../api/system';
import { getStoredLlmConfig } from '../../api/llmSession';
import styles from './Layout.module.css';

const PAGE_TITLES: Record<string, string> = {
  '/':       'Portfolio Summary',
  '/risk':   'Risk Flags',
  '/news':   'News Impact',
  '/chat':   'Financial Q&A',
  '/upload': 'Document Upload',
  '/status': 'System Status',
};

export function Layout() {
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] ?? 'Portfolio AI';

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [forceSettings, setForceSettings] = useState(false);
  const [startupChecking, setStartupChecking] = useState(true);

  useEffect(() => {
    const stored = getStoredLlmConfig();
    if (stored?.api_key) {
      setStartupChecking(false);
      return;
    }
    getHealth()
      .then((h) => {
        if (!h.api_key_configured) { setForceSettings(true); setSettingsOpen(true); }
      })
      .catch(() => { setForceSettings(true); setSettingsOpen(true); })
      .finally(() => setStartupChecking(false));
  }, []);

  const handleSettingsSaved = useCallback(() => {
    const stored = getStoredLlmConfig();
    if (stored?.api_key) {
      setForceSettings(false);
      setSettingsOpen(false);
    }
  }, []);

  const handleCloseSettings = useCallback(() => {
    if (!forceSettings) setSettingsOpen(false);
  }, [forceSettings]);

  return (
    <div className={styles.shell}>
      <Sidebar onOpenSettings={() => setSettingsOpen(true)} />
      <TopBar title={title} />
      <main className={styles.main}>
        {!startupChecking && <Outlet />}
      </main>
      {settingsOpen && (
        <ApiSettingsModal
          isOpen={settingsOpen}
          forceOpen={forceSettings}
          onClose={handleCloseSettings}
          onSaved={handleSettingsSaved}
        />
      )}
    </div>
  );
}
