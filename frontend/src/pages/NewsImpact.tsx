import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { getNewsImpact } from '../api/news';
import { AiCard } from '../components/common/AiCard';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorBanner } from '../components/common/ErrorBanner';
import styles from './Pages.module.css';

export function NewsImpact() {
  const { data, loading, error, refetch } = useApi(getNewsImpact);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  if (loading) {
    return (
      <div className={styles.pageGrid55_45}>
        <div className="card"><LoadingSkeleton lines={6} /></div>
        <div className="card"><LoadingSkeleton lines={4} /></div>
      </div>
    );
  }

  if (error) return <ErrorBanner message={error} onRetry={refetch} />;
  if (!data) return null;

  const { news_data, llm_news_summary } = data;

  const toggle = (ticker: string) =>
    setExpanded((prev) => ({ ...prev, [ticker]: !prev[ticker] }));

  return (
    <div className={styles.pageGrid55_45}>
      {/* Left — News Feed by Ticker */}
      <div className={styles.dataColumn}>
        {news_data.length === 0 ? (
          <div className="card">
            <p className="text-secondary">No news matches found.</p>
          </div>
        ) : (
          news_data.map((item, i) => {
            const isOpen = expanded[item.ticker] !== false; // default open
            return (
              <div
                key={item.ticker}
                className={`card animate-in stagger-${i + 1} ${styles.newsTickerCard}`}
              >
                <button
                  className={styles.newsTickerHeader}
                  onClick={() => toggle(item.ticker)}
                >
                  <span className={`mono ${styles.ticker}`}>{item.ticker}</span>
                  <span className="text-secondary">
                    {item.matched_news.length} article{item.matched_news.length !== 1 ? 's' : ''}
                  </span>
                  <span className={styles.chevron}>{isOpen ? '▾' : '▸'}</span>
                </button>
                {isOpen && (
                  <div className={styles.newsTimeline}>
                    {item.matched_news.map((news, j) => (
                      <div key={j} className={styles.newsItem}>
                        <div className={styles.timelineDot} />
                        <div className={styles.newsContent}>
                          <p className={styles.newsText}>{news.text}</p>
                          {news.metadata && (
                            <div className={styles.newsMeta}>
                              {Object.entries(news.metadata).map(([k, v]) => (
                                <span key={k} className={styles.metaTag}>
                                  {k}: {String(v)}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Right — AI Summary (sticky) */}
      <div className={styles.stickyColumn}>
        <AiCard className="animate-in stagger-2">
          <p className={styles.aiText}>{llm_news_summary}</p>
        </AiCard>
      </div>
    </div>
  );
}
