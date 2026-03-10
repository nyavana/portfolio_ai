import { useApi } from '../hooks/useApi';
import { getPortfolioSummary } from '../api/portfolio';
import { AiCard } from '../components/common/AiCard';
import { MarkdownRenderer } from '../components/common/MarkdownRenderer';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { DonutChart } from '../components/charts/DonutChart';
import { WeightBar } from '../components/charts/WeightBar';
import styles from './Pages.module.css';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function pnlColor(value: number): string {
  if (value > 0) return 'text-green';
  if (value < 0) return 'text-red';
  return '';
}

export function Dashboard() {
  const { data, loading, error, refetch } = useApi(getPortfolioSummary);

  if (loading) {
    return (
      <div className={styles.pageGrid2Col}>
        <div className="card"><LoadingSkeleton lines={8} /></div>
        <div className="card"><LoadingSkeleton lines={4} /></div>
      </div>
    );
  }

  if (error) return <ErrorBanner message={error} onRetry={refetch} />;
  if (!data) return null;

  const { summary_data: s, llm_summary } = data;
  const totalValue = s.total_value ?? s.portfolio_value ?? 0;
  const holdings = s.holdings ?? s.top_holdings ?? [];
  const sectors = s.sector_exposure ?? {};

  return (
    <div className={styles.pageGrid2Col}>
      {/* ── Left: Data Column ── */}
      <div className={styles.dataColumn}>
        {/* Hero Metric */}
        <div className={`card animate-in stagger-1 ${styles.heroCard}`}>
          <span className="label">Total Portfolio Value</span>
          <h1 className={`mono ${styles.heroValue} number-reveal`}>
            {formatCurrency(totalValue)}
          </h1>
          <div className={styles.heroMeta}>
            <span className="text-secondary">
              {s.num_holdings ?? holdings.length} holdings
            </span>
            {s.cash != null && (
              <span className="text-secondary">
                {formatCurrency(s.cash)} cash
              </span>
            )}
            {s.as_of_date && (
              <span className="text-tertiary">as of {s.as_of_date}</span>
            )}
          </div>
        </div>

        {/* Holdings Table */}
        <div className="card animate-in stagger-2">
          <span className="label">Holdings</span>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Ticker</th>
                <th>Name</th>
                <th className={styles.alignRight}>Price</th>
                <th className={styles.alignRight}>Market Value</th>
                <th className={styles.alignRight}>P&L</th>
                <th style={{ width: 120 }}>Weight</th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((h) => (
                <tr key={h.ticker} className={styles.tableRow}>
                  <td className={`mono ${styles.ticker}`}>{h.ticker}</td>
                  <td className="text-secondary">{h.name ?? '—'}</td>
                  <td className={`mono ${styles.alignRight}`}>
                    {h.price != null ? formatCurrency(h.price) : '—'}
                  </td>
                  <td className={`mono ${styles.alignRight}`}>
                    {h.market_value != null ? formatCurrency(h.market_value) : '—'}
                  </td>
                  <td className={`mono ${styles.alignRight} ${pnlColor(h.unrealized_pnl ?? 0)}`}>
                    {h.unrealized_pnl != null
                      ? `${h.unrealized_pnl >= 0 ? '+' : ''}${formatCurrency(h.unrealized_pnl)}`
                      : '—'}
                  </td>
                  <td>
                    <div className={styles.weightCell}>
                      <WeightBar value={h.weight ?? 0} />
                      <span className={`mono ${styles.weightLabel}`}>
                        {h.weight != null ? formatPct(h.weight) : '—'}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Sector Breakdown */}
        {Object.keys(sectors).length > 0 && (
          <div className="card animate-in stagger-3">
            <span className="label">Sector Exposure</span>
            <div style={{ marginTop: 'var(--space-md)' }}>
              <DonutChart data={sectors} />
            </div>
          </div>
        )}
      </div>

      {/* ── Right: AI Summary ── */}
      <div className={styles.aiColumn}>
        <AiCard className="animate-in stagger-2">
          <MarkdownRenderer>{llm_summary}</MarkdownRenderer>
        </AiCard>
      </div>
    </div>
  );
}
