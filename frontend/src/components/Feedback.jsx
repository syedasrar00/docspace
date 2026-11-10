import { AlertCircle, LoaderCircle } from 'lucide-react';

export function FullPageLoader({ label = 'Loading…' }) {
  return (
    <main className="full-page-state">
      <LoaderCircle className="spin" size={24} />
      <span>{label}</span>
    </main>
  );
}

export function LoadingState({ label = 'Loading…' }) {
  return (
    <div className="inline-state">
      <LoaderCircle className="spin" size={19} />
      <span>{label}</span>
    </div>
  );
}

export function ErrorBanner({ error, onRetry, compact = false }) {
  if (!error) return null;
  return (
    <div className={`error-banner${compact ? ' error-banner-compact' : ''}`} role="alert">
      <AlertCircle size={18} />
      <span>{typeof error === 'string' ? error : error.message}</span>
      {onRetry && <button className="text-button" onClick={onRetry} type="button">Retry</button>}
    </div>
  );
}
