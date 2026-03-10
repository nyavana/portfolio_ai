import { NavLink } from 'react-router-dom';
import styles from './Layout.module.css';

interface NavItem {
  readonly path: string;
  readonly icon: string;
  readonly label: string;
}

const NAV_ITEMS: readonly NavItem[] = [
  { path: '/',       icon: '◈', label: 'Dashboard' },
  { path: '/risk',   icon: '⚑', label: 'Risk Flags' },
  { path: '/news',   icon: '▤', label: 'News Impact' },
  { path: '/chat',   icon: '▸', label: 'Chat' },
  { path: '/upload', icon: '⇧', label: 'Upload' },
  { path: '/status', icon: '●', label: 'System' },
];

interface SidebarProps {
  readonly onOpenSettings: () => void;
}

export function Sidebar({ onOpenSettings }: SidebarProps) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarLogo}>
        <div className={styles.logoIcon}>P</div>
        <span className={styles.logoText}>Portfolio AI</span>
      </div>
      <nav className={styles.nav}>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
            }
          >
            <span className={styles.navIcon}>{item.icon}</span>
            <span className={styles.navLabel}>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className={styles.sidebarFooter}>
        <button className={styles.settingsBtn} onClick={onOpenSettings}>
          <span className={styles.navIcon}>⚙</span>
          <span className={styles.navLabel}>Settings</span>
        </button>
      </div>
    </aside>
  );
}
