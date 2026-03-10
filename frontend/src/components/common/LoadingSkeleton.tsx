import styles from './Common.module.css';

interface LoadingSkeletonProps {
  readonly lines?: number;
  readonly height?: string;
}

export function LoadingSkeleton({ lines = 3, height = '1rem' }: LoadingSkeletonProps) {
  return (
    <div className={styles.skeletonGroup}>
      {Array.from({ length: lines }, (_, i) => (
        <div
          key={i}
          className="skeleton"
          style={{
            height,
            width: i === lines - 1 ? '60%' : '100%',
            marginBottom: '0.5rem',
          }}
        />
      ))}
    </div>
  );
}
