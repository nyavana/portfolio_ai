import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
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

  return (
    <div className={styles.shell}>
      <Sidebar />
      <TopBar title={title} />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
