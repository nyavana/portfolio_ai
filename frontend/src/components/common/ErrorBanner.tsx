import styles from './Common.module.css';

interface ErrorBannerProps {
  readonly message: string;
  readonly onRetry?: () => void;
}

export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div className={styles.errorBanner}>
      <div className={styles.errorContent}>
        <span className={styles.errorIcon}>!</span>
        <p className={styles.errorText}>{message}</p>
      </div>
      {onRetry && (
        <button className="btn-ghost" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}
