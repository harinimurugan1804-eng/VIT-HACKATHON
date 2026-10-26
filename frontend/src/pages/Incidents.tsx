/**
 * pages/Incidents.tsx — stub
 */
import { AlertTriangle } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState } from '@/components/EmptyState'

export function IncidentsPage() {
  return (
    <div>
      <PageHeader
        title="Incidents"
        description="Search, filter and review all detected safety incidents"
      />
      <EmptyState
        icon={AlertTriangle}
        title="Incident table coming next"
        description="A filterable table (type, camera, severity, status, date range) with click-through to full incident detail will appear here."
      />
    </div>
  )
}
