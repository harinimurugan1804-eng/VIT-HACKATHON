/**
 * components/IncidentCard.tsx
 * Live incident card for the real-time event feed.
 * Displays severity badge (icon + word), incident type, camera name, and IST timestamp.
 * Clicking the card opens /incidents/{id}.
 */

import { useNavigate } from 'react-router-dom'
import { Camera, ChevronRight } from 'lucide-react'
import { SeverityBadge } from '@/components/SeverityBadge'
import { formatIncidentTime } from '@/lib/time'
import type { Incident } from '@/lib/types'

interface IncidentCardProps {
  incident: Incident
}

export function IncidentCard({ incident }: IncidentCardProps) {
  const navigate = useNavigate()

  return (
    <div
      onClick={() => navigate(`/incidents/${incident.id}`)}
      className="group relative p-3.5 rounded-xl border transition-all duration-200 hover:border-[var(--accent)] hover:shadow-md cursor-pointer select-none"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
      }}
      role="button"
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          navigate(`/incidents/${incident.id}`)
        }
      }}
      aria-label={`Incident #${incident.id}: ${incident.type} at ${incident.camera_name}`}
    >
      {/* Top row: Severity badge & Incident Type */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <SeverityBadge severity={incident.severity} size="sm" />
        <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-[var(--surface-hover)] text-[var(--text-secondary)] border border-[var(--border)]">
          {incident.type}
        </span>
      </div>

      {/* Middle row: Camera name */}
      <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-primary)] mb-2 truncate">
        <Camera className="w-3.5 h-3.5 shrink-0 text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors" />
        <span className="truncate">{incident.camera_name}</span>
      </div>

      {/* Bottom row: IST Timestamp + Arrow indicator */}
      <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] font-mono">
        <span>{formatIncidentTime(incident.started_at)}</span>
        <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:translate-x-0.5 group-hover:text-[var(--accent)] transition-all" />
      </div>
    </div>
  )
}
