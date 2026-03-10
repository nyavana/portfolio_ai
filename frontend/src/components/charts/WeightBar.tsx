import styles from './Charts.module.css';

interface WeightBarProps {
  readonly value: number;  // 0–1
  readonly color?: string;
}

export function WeightBar({ value, color = 'var(--accent-cyan)' }: WeightBarProps) {
  const pct = Math.min(Math.max(value * 100, 0), 100);
  return (
    <div className={styles.weightBarTrack}>
      <div
        className={styles.weightBarFill}
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}
