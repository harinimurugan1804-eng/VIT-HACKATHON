/**
 * components/SeverityBadge.tsx
 * Severity indicator. Colour is never the only signal — it always uses icon + word.
 */

import { AlertTriangle, AlertCircle, Info } from 'lucide-react'
import type { Severity } from '@/lib/types'

interface Props {
  severity: Severity
  size?: 'sm' | 'md'
}

const CONFIG: Record<Severity, { label: string; icon: React.ReactNode; classes: string }> = {
  critical: {
    label: 'Critical',
    icon: <AlertCircle className="w-3 h-3 shrink-0" aria-hidden="true" />,
    classes: 'bg-[var(--critical-subtle)] text-[var(--critical)] border-[var(--critical)]/30',
  },
  high: {
    label: 'High',
    icon: <AlertTriangle className="w-3 h-3 shrink-0" aria-hidden="true" />,
    classes: 'bg-[var(--high-subtle)] text-[var(--high)] border-[var(--high)]/30',
  },
  low: {
    label: 'Low',
    icon: <Info className="w-3 h-3 shrink-0" aria-hidden="true" />,
    classes: 'bg-[var(--low-subtle)] text-[var(--low)] border-[var(--low)]/30',
  },
}

export function SeverityBadge({ severity, size = 'md' }: Props) {
  const { label, icon, classes } = CONFIG[severity]
  const sizeClass = size === 'sm' ? 'text-[10px] px-1.5 py-0.5 gap-1' : 'text-xs px-2 py-1 gap-1.5'

  return (
    <span
      className={`inline-flex items-center font-medium border rounded-md tabular ${sizeClass} ${classes}`}
      role="status"
      aria-label={`Severity: ${label}`}
    >
      {icon}
      {label}
    </span>
  )
}
