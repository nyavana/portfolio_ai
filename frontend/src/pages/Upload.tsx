import { useState, useCallback } from 'react';
import { DropZone } from '../components/common/DropZone';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { uploadFiling, uploadNews } from '../api/upload';
import type { UploadResponse } from '../types/api';
import styles from './Pages.module.css';

interface UploadResult {
  readonly type: 'filing' | 'news';
  readonly filename: string;
  readonly response: UploadResponse;
  readonly timestamp: number;
}

export function Upload() {
  const [filingUploading, setFilingUploading] = useState(false);
  const [newsUploading, setNewsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<readonly UploadResult[]>([]);

  const handleFiling = useCallback(async (file: File) => {
    setFilingUploading(true);
    setError(null);
    try {
      const res = await uploadFiling(file);
      setResults((prev) => [
        { type: 'filing', filename: file.name, response: res, timestamp: Date.now() },
        ...prev,
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setFilingUploading(false);
    }
  }, []);

  const handleNews = useCallback(async (file: File) => {
    setNewsUploading(true);
    setError(null);
    try {
      const res = await uploadNews(file);
      setResults((prev) => [
        { type: 'news', filename: file.name, response: res, timestamp: Date.now() },
        ...prev,
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setNewsUploading(false);
    }
  }, []);

  return (
    <div className={styles.stackLayout}>
      {error && <ErrorBanner message={error} />}

      {/* Upload Zones */}
      <div className={styles.uploadGrid}>
        <div className="card animate-in stagger-1">
          <span className="label">SEC Filing</span>
          <div style={{ marginTop: 'var(--space-md)' }}>
            <DropZone
              label="Upload Filing Document"
              onFile={handleFiling}
              uploading={filingUploading}
            />
          </div>
        </div>
        <div className="card animate-in stagger-2">
          <span className="label">News Article</span>
          <div style={{ marginTop: 'var(--space-md)' }}>
            <DropZone
              label="Upload News Document"
              onFile={handleNews}
              uploading={newsUploading}
            />
          </div>
        </div>
      </div>

      {/* Upload Results */}
      {results.length > 0 && (
        <div className="card animate-in">
          <span className="label">Upload History</span>
          <div className={styles.uploadResults}>
            {results.map((r) => (
              <div
                key={r.timestamp}
                className={`${styles.uploadResultItem} pulse-success`}
              >
                <div className={styles.uploadResultHeader}>
                  <span className={`mono ${styles.ticker}`}>
                    {r.type.toUpperCase()}
                  </span>
                  <span className={styles.uploadFilename}>{r.filename}</span>
                  <span className="text-green">{r.response.status}</span>
                </div>
                {r.response.index_result && (
                  <div className={styles.uploadMeta}>
                    <span className="mono text-secondary">
                      {r.response.index_result.chunks_indexed} chunks indexed
                    </span>
                    <span className="text-tertiary">
                      collection: {r.response.index_result.collection}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
