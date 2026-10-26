/**
 * components/ErrorState.tsx
 * Error state with a retry button.
 */

import { AlertTriangle } from 'lucide-react'

interface Props {
  message?: string
  onRetry?: () => void
}

export function ErrorState({
  message = 'Something went wrong while loading data.',
  onRetry,
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
        style={{ background: 'var(--critical-subtle)' }}
      >
        <AlertTriangle className="w-7 h-7 text-[var(--critical)]" aria-hidden="true" />
      </div>
      <h2 className="text-base font-semibold text-[var(--text-primary)] mb-1">
        Failed to load
      </h2>
      <p className="text-sm text-[var(--text-secondary)] max-w-sm mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 rounded-md text-sm font-medium transition-colors"
          style={{ background: 'var(--surface-raised)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-hover)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface-raised)')}
        >
          Retry
        </button>
      )}
    </div>
  )
}
