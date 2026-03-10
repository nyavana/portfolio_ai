import styles from './Charts.module.css';

interface DonutChartProps {
  readonly data: Record<string, number>;
  readonly size?: number;
}

const COLORS = [
  'var(--accent-cyan)',
  'var(--accent-blue)',
  'var(--accent-green)',
  'var(--accent-amber)',
  'var(--accent-red)',
  'var(--text-tertiary)',
];

export function DonutChart({ data, size = 180 }: DonutChartProps) {
  const entries = Object.entries(data).sort(([, a], [, b]) => b - a);
  const total = entries.reduce((sum, [, v]) => sum + v, 0);

  // Build conic-gradient segments
  let accumulated = 0;
  const segments = entries.map(([, value], i) => {
    const start = accumulated;
    const pct = total > 0 ? (value / total) * 100 : 0;
    accumulated += pct;
    return `${COLORS[i % COLORS.length]} ${start}% ${start + pct}%`;
  });

  const gradient = `conic-gradient(${segments.join(', ')})`;

  return (
    <div className={styles.donutWrapper}>
      <div
        className={styles.donut}
        style={{
          width: size,
          height: size,
          background: gradient,
        }}
      >
        <div className={styles.donutHole} />
      </div>
      <div className={styles.legend}>
        {entries.map(([label, value], i) => (
          <div key={label} className={styles.legendItem}>
            <span
              className={styles.legendDot}
              style={{ background: COLORS[i % COLORS.length] }}
            />
            <span className={styles.legendLabel}>{label}</span>
            <span className={`${styles.legendValue} mono`}>
              {(value * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
