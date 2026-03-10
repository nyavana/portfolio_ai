import styles from './Common.module.css';

interface SeverityBadgeProps {
  readonly severity: string;
  readonly label?: string;
}

const SEVERITY_MAP: Record<string, string> = {
  high: 'badgeRed',
  medium: 'badgeAmber',
  low: 'badgeGreen',
};

export function SeverityBadge({ severity, label }: SeverityBadgeProps) {
  const cls = SEVERITY_MAP[severity] ?? 'badgeBlue';
  return (
    <span className={`${styles.badge} ${styles[cls]}`}>
      {label ?? severity}
    </span>
  );
}
