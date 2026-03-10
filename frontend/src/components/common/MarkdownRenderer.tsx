import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from './MarkdownRenderer.module.css';

interface MarkdownRendererProps {
  readonly children: string;
  readonly className?: string;
}

export function MarkdownRenderer({ children, className = '' }: MarkdownRendererProps) {
  return (
    <div className={`${styles.markdown} ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
