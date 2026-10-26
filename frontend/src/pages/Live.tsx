/**
 * pages/Live.tsx — stub
 */
import { Video } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState } from '@/components/EmptyState'

export function LivePage() {
  return (
    <div>
      <PageHeader
        title="Live Feed"
        description="Real-time CCTV streams and live incident alerts"
      />
      <EmptyState
        icon={Video}
        title="Camera grid coming next"
        description="Live MJPEG streams, FPS indicators, status dots, and the live incident WebSocket feed will appear here."
      />
    </div>
  )
}
