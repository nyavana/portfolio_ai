import { useApi } from '../hooks/useApi';
import { getStatus, getHealth } from '../api/system';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorBanner } from '../components/common/ErrorBanner';
import styles from './Pages.module.css';

export function Status() {
  const status = useApi(getStatus);
  const health = useApi(getHealth);

  return (
    <div className={styles.stackLayout}>
      {/* Health Check */}
      <div className="card animate-in stagger-1">
        <span className="label">Service Health</span>
        {health.loading ? (
          <LoadingSkeleton lines={3} />
        ) : health.error ? (
          <ErrorBanner message={health.error} onRetry={health.refetch} />
        ) : health.data ? (
          <div className={styles.statusGrid}>
            <div className={styles.statusItem}>
              <span className="text-secondary">Status</span>
              <span className={health.data.status === 'ok' ? 'text-green' : 'text-red'}>
                {health.data.status}
              </span>
            </div>
            <div className={styles.statusItem}>
              <span className="text-secondary">LLM Endpoint</span>
              <span className={`mono ${styles.statusValue}`}>
                {health.data.lmdeploy_base_url}
              </span>
            </div>
            <div className={styles.statusItem}>
              <span className="text-secondary">Model</span>
              <span className={`mono ${styles.statusValue}`}>
                {health.data.lmdeploy_model}
              </span>
            </div>
          </div>
        ) : null}
      </div>

      {/* Routes */}
      <div className="card animate-in stagger-2">
        <span className="label">Available Routes</span>
        {status.loading ? (
          <LoadingSkeleton lines={4} />
        ) : status.error ? (
          <ErrorBanner message={status.error} onRetry={status.refetch} />
        ) : status.data ? (
          <>
            <p className="text-secondary" style={{ margin: 'var(--space-sm) 0 var(--space-md)' }}>
              {status.data.message}
            </p>
            <div className={styles.routeList}>
              {status.data.routes.map((route) => (
                <code key={route} className={styles.routeItem}>
                  {route}
                </code>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
