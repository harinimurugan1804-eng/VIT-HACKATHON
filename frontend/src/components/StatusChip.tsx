/**
 * components/StatusChip.tsx
 * Incident status indicator. Icon + word, never colour alone.
 */

import { Clock, CheckCircle, XCircle, CheckCheck } from 'lucide-react'
import type { IncidentStatus } from '@/lib/types'

interface Props {
  status: IncidentStatus
  size?: 'sm' | 'md'
}

const CONFIG: Record<IncidentStatus, { label: string; icon: React.ReactNode; classes: string }> = {
  open: {
    label: 'Open',
    icon: <Clock className="w-3 h-3 shrink-0" aria-hidden="true" />,
    classes: 'bg-[var(--critical-subtle)] text-[var(--critical)] border-[var(--critical)]/30',
  },
  acknowledged: {
    label: 'Acknowledged',
    icon: <CheckCircle className="w-3 h-3 shrink-0" aria-hidden="true" />,
    classes: 'bg-[var(--high-subtle)] text-[var(--high)] border-[var(--high)]/30',
  },
  resolved: {
    label: 'Resolved',
    icon: <CheckCheck className="w-3 h-3 shrink-0" aria-hidden="true" />,
    classes: 'bg-[var(--resolved-subtle)] text-[var(--resolved)] border-[var(--resolved)]/30',
  },
  false_alarm: {
    label: 'False Alarm',
    icon: <XCircle className="w-3 h-3 shrink-0" aria-hidden="true" />,
    classes: 'bg-[var(--neutral-subtle)] text-[var(--neutral)] border-[var(--neutral)]/30',
  },
}

export function StatusChip({ status, size = 'md' }: Props) {
  const { label, icon, classes } = CONFIG[status]
  const sizeClass = size === 'sm' ? 'text-[10px] px-1.5 py-0.5 gap-1' : 'text-xs px-2 py-1 gap-1.5'

  return (
    <span
      className={`inline-flex items-center font-medium border rounded-md tabular ${sizeClass} ${classes}`}
      role="status"
      aria-label={`Status: ${label}`}
    >
      {icon}
      {label}
    </span>
  )
}
