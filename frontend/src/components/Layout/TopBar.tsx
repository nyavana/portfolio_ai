import { useApi } from '../../hooks/useApi';
import { getHealth } from '../../api/system';
import styles from './Layout.module.css';

interface TopBarProps {
  readonly title: string;
}

export function TopBar({ title }: TopBarProps) {
  const health = useApi(getHealth);

  const isOnline = health.data?.status === 'ok';
  const model = health.data?.lmdeploy_model ?? '—';

  return (
    <header className={styles.topbar}>
      <div className={styles.topbarLeft}>
        <h1 className={styles.pageTitle}>{title}</h1>
      </div>
      <div className={styles.topbarLeft}>
        <span
          className={`${styles.statusDot} ${!isOnline && !health.loading ? styles.statusDotError : ''}`}
        />
        <span className={styles.statusText}>
          {health.loading ? 'connecting…' : isOnline ? model : 'offline'}
        </span>
      </div>
    </header>
  );
}
