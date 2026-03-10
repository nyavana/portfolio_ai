import { useApi } from '../hooks/useApi';
import { getRiskFlags } from '../api/risk';
import { AiCard } from '../components/common/AiCard';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorBanner } from '../components/common/ErrorBanner';
import styles from './Pages.module.css';

function riskTypeLabel(type: string): string {
  return type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function RiskFlags() {
  const { data, loading, error, refetch } = useApi(getRiskFlags);

  if (loading) {
    return (
      <div className={styles.stackLayout}>
        <div className="card"><LoadingSkeleton lines={4} /></div>
        <div className="card"><LoadingSkeleton lines={3} /></div>
      </div>
    );
  }

  if (error) return <ErrorBanner message={error} onRetry={refetch} />;
  if (!data) return null;

  const { flags, llm_risk_summary } = data;

  return (
    <div className={styles.stackLayout}>
      {/* Risk Cards Grid */}
      <div className={styles.riskGrid}>
        {flags.length === 0 ? (
          <div className="card">
            <p className="text-secondary">No risk flags detected.</p>
          </div>
        ) : (
          flags.map((flag, i) => (
            <div
              key={`${flag.type}-${i}`}
              className={`card animate-slide-in stagger-${i + 1} ${styles.riskCard}`}
            >
              <div className={styles.riskHeader}>
                <SeverityBadge severity={flag.severity ?? 'medium'} />
                {flag.ticker && (
                  <span className={`mono ${styles.riskTicker}`}>{flag.ticker}</span>
                )}
                {flag.sector && (
                  <span className={styles.riskSector}>{flag.sector}</span>
                )}
              </div>
              <h3 className={styles.riskTitle}>{riskTypeLabel(flag.type)}</h3>
              <p className={`text-secondary ${styles.riskMessage}`}>{flag.message}</p>
            </div>
          ))
        )}
      </div>

      {/* AI Risk Summary */}
      <AiCard className="animate-in stagger-4">
        <p className={styles.aiText}>{llm_risk_summary}</p>
      </AiCard>
    </div>
  );
}
