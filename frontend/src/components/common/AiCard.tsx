import type { ReactNode } from 'react';

interface AiCardProps {
  readonly children: ReactNode;
  readonly className?: string;
}

export function AiCard({ children, className = '' }: AiCardProps) {
  return (
    <div className={`ai-card ${className}`}>
      <div className="ai-label">AI Analysis</div>
      {children}
    </div>
  );
}
