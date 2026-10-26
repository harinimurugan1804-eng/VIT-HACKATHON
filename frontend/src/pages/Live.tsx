/**
 * pages/Live.tsx
 * Real-time CCTV surveillance grid and live incident feed.
 * Features:
 * - 2x2 Camera stream grid with resilient error recovery and mock mode indicator.
 * - Live incident feed column (WebSocket powered, newest first) with IncidentCard components.
 * - Multi-tier alerts:
 *   - Critical: toast + Web Audio API beep + 10s red pulse on camera tile.
 *   - High: toast notification only.
 *   - Low: feed only.
 * - Fully responsive side-by-side layout at 1366x768 without horizontal scroll.
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Video,
  Activity,
  MapPin,
  Eye,
  Radio,
  AlertCircle,
  AlertTriangle,
  X,
  ShieldAlert,
} from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { CameraStream } from '@/components/CameraStream'
import { IncidentCard } from '@/components/IncidentCard'
import { SkeletonCameraGrid } from '@/components/Skeletons'
import { fetchCameras, fetchEvents } from '@/lib/api'
import { wsClient } from '@/lib/ws'
import { playCriticalBeep } from '@/lib/audio'
import { formatTime } from '@/lib/time'
import type { Camera, Incident, WsEvent } from '@/lib/types'

interface ToastAlert {
  id: string
  incidentId: number
  severity: 'critical' | 'high'
  title: string
  message: string
  timestamp: string
}

export function LivePage() {
  const navigate = useNavigate()
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [pulsingCameraIds, setPulsingCameraIds] = useState<Record<string, number>>({})
  const [toasts, setToasts] = useState<ToastAlert[]>([])

  // Fetch CCTV cameras
  const { data: cameras, isLoading: camerasLoading, error: camerasError } = useQuery<Camera[]>({
    queryKey: ['cameras'],
    queryFn: fetchCameras,
    refetchInterval: 30_000,
  })

  // Initial load of recent incidents
  const { data: initialEvents } = useQuery<Incident[]>({
    queryKey: ['live-feed-events'],
    queryFn: () => fetchEvents({ limit: 40 }),
  })

  // Populate initial incidents
  useEffect(() => {
    if (initialEvents && initialEvents.length > 0) {
      setIncidents(prev => {
        const idSet = new Set(prev.map(i => i.id))
        const merged = [...prev]
        for (const inc of initialEvents) {
          if (!idSet.has(inc.id)) {
            merged.push(inc)
            idSet.add(inc.id)
          }
        }
        return merged.sort(
          (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime(),
        )
      })
    }
  }, [initialEvents])

  // Handle incoming real-time incident
  const handleIncomingIncident = useCallback((incident: Incident) => {
    // Prepend newest first
    setIncidents(prev => {
      const exists = prev.some(i => i.id === incident.id)
      if (exists) {
        return prev.map(i => (i.id === incident.id ? incident : i))
      }
      return [incident, ...prev]
    })

    // Critical Alert: toast + short beep + 10s red pulse on camera tile
    if (incident.severity === 'critical') {
      playCriticalBeep()

      const toastId = `toast-${incident.id}-${Date.now()}`
      const newToast: ToastAlert = {
        id: toastId,
        incidentId: incident.id,
        severity: 'critical',
        title: `Critical Alert: ${incident.type.toUpperCase()}`,
        message: `${incident.camera_name} — immediate response required`,
        timestamp: formatTime(incident.started_at),
      }
      setToasts(prev => [newToast, ...prev.slice(0, 4)])

      // Auto dismiss toast after 6s
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toastId))
      }, 6000)

      // Red pulse on camera tile for 10 seconds
      if (incident.camera_id) {
        setPulsingCameraIds(prev => ({
          ...prev,
          [incident.camera_id]: Date.now() + 10_000,
        }))

        setTimeout(() => {
          setPulsingCameraIds(prev => {
            const next = { ...prev }
            delete next[incident.camera_id]
            return next
          })
        }, 10_000)
      }
    }
    // High Alert: toast only
    else if (incident.severity === 'high') {
      const toastId = `toast-${incident.id}-${Date.now()}`
      const newToast: ToastAlert = {
        id: toastId,
        incidentId: incident.id,
        severity: 'high',
        title: `High Alert: ${incident.type.toUpperCase()}`,
        message: `${incident.camera_name} — investigation recommended`,
        timestamp: formatTime(incident.started_at),
      }
      setToasts(prev => [newToast, ...prev.slice(0, 4)])

      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toastId))
      }, 5000)
    }
    // Low Alert: feed only (no toast, no beep, no pulse)
  }, [])

  // Subscribe to WebSocket events
  useEffect(() => {
    const unsubscribe = wsClient.subscribe((event: WsEvent) => {
      let incident: Incident | null = null
      if (event && typeof event === 'object') {
        if ('id' in event && 'type' in event && 'severity' in event) {
          incident = event as Incident
        } else if (
          'data' in event &&
          event.data &&
          typeof event.data === 'object' &&
          'id' in event.data
        ) {
          incident = event.data as Incident
        }
      }

      if (incident) {
        handleIncomingIncident(incident)
      }
    })

    return unsubscribe
  }, [handleIncomingIncident])

  return (
    <div className="space-y-5 overflow-x-hidden">
      {/* Toast notifications stack */}
      {toasts.length > 0 && (
        <aside
          aria-label="Security alerts"
          className="fixed top-20 right-6 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none"
        >
          {toasts.map(toast => (
            <div
              key={toast.id}
              onClick={() => navigate(`/incidents/${toast.incidentId}`)}
              className="pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-2xl backdrop-blur-md transition-all duration-200 cursor-pointer animate-in fade-in slide-in-from-top-2"
              style={{
                background:
                  toast.severity === 'critical'
                    ? 'rgba(28, 12, 16, 0.96)'
                    : 'rgba(28, 20, 10, 0.96)',
                borderColor:
                  toast.severity === 'critical'
                    ? 'rgba(244, 63, 94, 0.5)'
                    : 'rgba(245, 158, 11, 0.5)',
                boxShadow:
                  toast.severity === 'critical'
                    ? '0 10px 25px -5px rgba(244, 63, 94, 0.35)'
                    : '0 10px 25px -5px rgba(245, 158, 11, 0.25)',
              }}
              role="status"
            >
              <div className="mt-0.5 shrink-0">
                {toast.severity === 'critical' ? (
                  <AlertCircle className="w-5 h-5 text-rose-500 animate-pulse" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="text-xs font-bold tracking-tight"
                    style={{
                      color: toast.severity === 'critical' ? '#fda4af' : '#fcd34d',
                    }}
                  >
                    {toast.title}
                  </span>
                  <span className="text-[10px] font-mono text-[var(--text-muted)]">
                    {toast.timestamp}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-2">
                  {toast.message}
                </p>
              </div>
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation()
                  setToasts(prev => prev.filter(t => t.id !== toast.id))
                }}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] shrink-0 p-1 cursor-pointer"
                aria-label="Dismiss alert"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </aside>
      )}

      <PageHeader
        title="Live Surveillance Feed"
        description="Real-time CCTV grid, instant multi-tier incident detection, and automated signed stream recovery"
      />

      {/* Main Side-by-Side Container (Fits side by side at 1366x768 without horizontal scroll) */}
      <div className="flex flex-col lg:flex-row gap-5 items-start overflow-x-hidden">
        {/* ── Left Column: 2x2 Camera Grid ────────────────────── */}
        <div className="flex-1 min-w-0 w-full">
          {camerasLoading ? (
            <SkeletonCameraGrid count={4} />
          ) : camerasError ? (
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(cameras || []).map(camera => {
                const isPulsing = Boolean(pulsingCameraIds[camera.id])

                return (
                  <div
                    key={camera.id}
                    className={`group rounded-xl border overflow-hidden flex flex-col transition-all duration-300 shadow-md ${
                      isPulsing
                        ? 'ring-2 ring-rose-500 animate-pulse shadow-[0_0_30px_rgba(244,63,94,0.6)] border-rose-500'
                        : 'hover:border-[var(--accent)]'
                    }`}
                    style={{
                      background: 'var(--surface)',
                      borderColor: isPulsing ? '#f43f5e' : 'var(--border)',
                    }}
                  >
                    {/* Camera Header Bar */}
                    <div
                      className="flex items-center justify-between px-3.5 py-2.5 border-b text-xs shrink-0"
                      style={{
                        background: isPulsing
                          ? 'rgba(244, 63, 94, 0.15)'
                          : 'var(--surface-subtle)',
                        borderColor: isPulsing ? '#f43f5e' : 'var(--border)',
                      }}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            isPulsing
                              ? 'bg-rose-500 animate-ping'
                              : camera.online
                              ? 'bg-emerald-500 animate-pulse'
                              : 'bg-zinc-500'
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
                            background: camera.online
                              ? 'var(--resolved-subtle)'
                              : 'var(--neutral-subtle)',
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
                          <span className="text-xs font-medium">Camera signal offline</span>
                        </div>
                      )}

                      {/* Overlaid Active Zones Badge */}
                      {camera.zones && camera.zones.length > 0 && (
                        <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded bg-black/70 backdrop-blur text-[10px] text-zinc-300 border border-white/10">
                          <Eye className="w-3 h-3 text-[var(--accent)]" />
                          <span>
                            {camera.zones.length} {camera.zones.length === 1 ? 'Zone' : 'Zones'}
                          </span>
                        </div>
                      )}

                      {/* Red Pulse Warning Tag */}
                      {isPulsing && (
                        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold shadow-md">
                          <ShieldAlert className="w-3 h-3" />
                          <span>CRITICAL ALERT ACTIVE</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Right Column: Live Incident Feed (Newest first) ─── */}
        <aside
          aria-label="Live incident feed"
          className="w-full lg:w-[360px] lg:shrink-0 flex flex-col rounded-xl border shadow-lg overflow-hidden"
          style={{
            background: 'var(--surface)',
            borderColor: 'var(--border)',
          }}
        >
          {/* Feed Header */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b shrink-0"
            style={{
              background: 'var(--surface-subtle)',
              borderColor: 'var(--border)',
            }}
          >
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                Live Incident Feed
              </h2>
            </div>
            <span
              className="text-[11px] font-mono px-2 py-0.5 rounded-full border"
              style={{
                background: 'var(--accent-subtle)',
                color: 'var(--accent)',
                borderColor: 'var(--border)',
              }}
            >
              {incidents.length} {incidents.length === 1 ? 'event' : 'events'}
            </span>
          </div>

          {/* Feed List (Scrollable, newest first) */}
          <div className="p-3 space-y-2.5 overflow-y-auto max-h-[580px] lg:max-h-[calc(100vh-210px)] min-h-[300px]">
            {incidents.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-[var(--text-muted)] gap-2">
                <Activity className="w-8 h-8 opacity-40" />
                <span className="text-xs font-medium text-[var(--text-secondary)]">
                  No active incidents
                </span>
                <p className="text-[11px]">Surveillance nodes operational. All sectors secure.</p>
              </div>
            ) : (
              incidents.map(incident => (
                <IncidentCard key={incident.id} incident={incident} />
              ))
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
