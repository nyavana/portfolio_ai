import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { getNewsImpact } from '../api/news';
import { AiCard } from '../components/common/AiCard';
import { MarkdownRenderer } from '../components/common/MarkdownRenderer';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorBanner } from '../components/common/ErrorBanner';
import type { NewsDocumentItem } from '../types/api';
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

  const { news_data, general_news, llm_news_summary } = data;

  const toggle = (ticker: string) =>
    setExpanded((prev) => ({ ...prev, [ticker]: !prev[ticker] }));

  const renderNewsCard = (
    key: string,
    label: string,
    items: readonly NewsDocumentItem[],
    index: number,
  ) => {
    const isOpen = expanded[key] !== false;

    return (
      <div
        key={key}
        className={`card animate-in stagger-${Math.min(index + 1, 4)} ${styles.newsTickerCard}`}
      >
        <button
          className={styles.newsTickerHeader}
          onClick={() => toggle(key)}
        >
          <span className={`mono ${styles.ticker}`}>{label}</span>
          <span className="text-secondary">
            {items.length} article{items.length !== 1 ? 's' : ''}
          </span>
          <span className={styles.chevron}>{isOpen ? '▾' : '▸'}</span>
        </button>
        {isOpen && (
          <div className={styles.newsTimeline}>
            {items.map((news, newsIndex) => (
              <div key={newsIndex} className={styles.newsItem}>
                <div className={styles.timelineDot} />
                <div className={styles.newsContent}>
                  <p className={styles.newsText}>{news.text}</p>
                  {news.metadata && (
                    <div className={styles.newsMeta}>
                      {Object.entries(news.metadata).map(([metadataKey, value]) => (
                        <span key={metadataKey} className={styles.metaTag}>
                          {metadataKey}: {String(value)}
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
  };

  return (
    <div className={styles.pageGrid55_45}>
      {/* Left — News Feed by Ticker */}
      <div className={styles.dataColumn}>
        {news_data.length === 0 && general_news.length === 0 ? (
          <div className="card">
            <p className="text-secondary">No news matches found.</p>
          </div>
        ) : (
          <>
            {news_data.map((item, i) =>
              renderNewsCard(item.ticker, item.ticker, item.matched_news, i),
            )}
            {general_news.length > 0 && (
              <>
                <p className={styles.newsSectionLabel}>General Market</p>
                {renderNewsCard('__general__', 'GENERAL', general_news, news_data.length)}
              </>
            )}
          </>
        )}
      </div>

      {/* Right — AI Summary (sticky) */}
      <div className={styles.stickyColumn}>
        <AiCard className="animate-in stagger-2">
          <MarkdownRenderer>{llm_news_summary}</MarkdownRenderer>
        </AiCard>
      </div>
    </div>
  );
}
