/**
 * pages/Live.tsx
 * Real-time CCTV streams and monitoring control board.
 * Uses CameraStream component which automatically fetches fresh signed stream URLs on load failure.
 */

import { useQuery } from '@tanstack/react-query'
import { Video, Activity, MapPin, Eye } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { CameraStream } from '@/components/CameraStream'
import { SkeletonCameraGrid } from '@/components/Skeletons'
import { fetchCameras } from '@/lib/api'
import type { Camera } from '@/lib/types'

export function LivePage() {
  const { data: cameras, isLoading, error } = useQuery<Camera[]>({
    queryKey: ['cameras'],
    queryFn: fetchCameras,
    refetchInterval: 30_000,
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Live Surveillance Feed"
        description="Real-time multi-angle CCTV streams, signed stream authentication, and automated error-recovery"
      />

      {isLoading ? (
        <SkeletonCameraGrid count={4} />
      ) : error ? (
        <div
          className="p-6 rounded-xl border text-center text-sm font-medium"
          style={{
            background: 'var(--critical-subtle)',
            borderColor: 'var(--critical)' + '40',
            color: 'var(--critical)',
          }}
        >
          Failed to load camera feeds. Please check network connection or verify session.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-5">
          {(cameras || []).map(camera => (
            <div
              key={camera.id}
              className="group rounded-xl border overflow-hidden flex flex-col transition-all hover:border-[var(--accent)] shadow-lg"
              style={{
                background: 'var(--surface)',
                borderColor: 'var(--border)',
              }}
            >
              {/* Camera Header Bar */}
              <div
                className="flex items-center justify-between px-4 py-3 border-b text-xs shrink-0"
                style={{
                  background: 'var(--surface-subtle)',
                  borderColor: 'var(--border)',
                }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      camera.online ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-500'
                    }`}
                  />
                  <span className="font-semibold text-[var(--text-primary)] truncate">
                    {camera.name}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {camera.location && (
                    <span className="hidden sm:inline-flex items-center gap-1 text-[var(--text-muted)] text-[11px]">
                      <MapPin className="w-3 h-3" />
                      {camera.location}
                    </span>
                  )}
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono border"
                    style={{
                      background: camera.online ? 'var(--resolved-subtle)' : 'var(--neutral-subtle)',
                      color: camera.online ? 'var(--resolved)' : 'var(--neutral)',
                      borderColor: 'var(--border)',
                    }}
                  >
                    <Activity className="w-3 h-3" />
                    {camera.online ? `${camera.fps} FPS` : 'OFFLINE'}
                  </span>
                </div>
              </div>

              {/* Stream Video Container */}
              <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                {camera.online ? (
                  <CameraStream
                    cameraId={camera.id}
                    initialStreamUrl={camera.stream_url}
                    alt={camera.name}
                    className="w-full h-full"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-[var(--text-muted)] gap-2 p-6">
                    <Video className="w-10 h-10 opacity-30" />
                    <span className="text-xs font-medium">Camera signal currently offline</span>
                  </div>
                )}

                {/* Overlaid Zone Indicator Pill */}
                {camera.zones && camera.zones.length > 0 && (
                  <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 rounded bg-black/70 backdrop-blur text-[10px] text-zinc-300 border border-white/10">
                    <Eye className="w-3 h-3 text-[var(--accent)]" />
                    <span>{camera.zones.length} Active {camera.zones.length === 1 ? 'Zone' : 'Zones'}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
