import { useState, useCallback, useRef } from 'react';
import type { DragEvent } from 'react';
import styles from './Common.module.css';

interface DropZoneProps {
  readonly label: string;
  readonly accept?: string;
  readonly onFile: (file: File) => void;
  readonly uploading?: boolean;
}

export function DropZone({ label, accept = '.txt,.json,.csv,.pdf,.md', onFile, uploading }: DropZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) onFile(file);
    },
    [onFile],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onFile(file);
      e.target.value = '';
    },
    [onFile],
  );

  return (
    <div
      className={`${styles.dropZone} ${dragOver ? styles.dropZoneActive : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className={styles.fileInput}
      />
      {uploading ? (
        <div className="spinner" />
      ) : (
        <>
          <span className={styles.dropIcon}>⇧</span>
          <span className={styles.dropLabel}>{label}</span>
          <span className={styles.dropHint}>Drop file or click to browse</span>
        </>
      )}
    </div>
  );
}
