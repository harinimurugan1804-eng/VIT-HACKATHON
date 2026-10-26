/**
 * lib/ws.ts
 * WebSocket client for /ws/events.
 * In mock mode, emits a fake new incident every 20 seconds.
 */

import type { WsEvent, Incident } from './types'

export type WsHandler = (event: WsEvent) => void

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true'
const API_URL   = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

/* ── Mock incident templates ───────────────────────────── */

const MOCK_CAMERAS = ['cam-east-wing', 'cam-south-gate', 'cam-warehouse-a', 'cam-roof-level']
const MOCK_CAMERA_NAMES = [
  'East Wing, Loading Bay 2',
  'South Gate, Entry Point',
  'Warehouse A, Racking Zone',
  'Roof Level, HVAC Area',
]
const MOCK_TYPES = ['access', 'ppe', 'fall', 'fire', 'unattended', 'loitering', 'crowding'] as const
const MOCK_SEVERITIES = ['critical', 'high', 'low'] as const
let _mockIdCounter = 900

function makeMockIncident(): Incident {
  const camIdx = Math.floor(Math.random() * MOCK_CAMERAS.length)
  const type   = MOCK_TYPES[Math.floor(Math.random() * MOCK_TYPES.length)]
  const sev    = MOCK_SEVERITIES[Math.floor(Math.random() * MOCK_SEVERITIES.length)]
  const id     = ++_mockIdCounter
  return {
    id,
    type,
    severity: sev,
    status: 'open',
    camera_id: MOCK_CAMERAS[camIdx],
    camera_name: MOCK_CAMERA_NAMES[camIdx],
    zone: 'zone-' + type,
    started_at: new Date().toISOString(),
    confidence: Math.round((0.72 + Math.random() * 0.27) * 100) / 100,
    snapshot_url: `/media/${id}.jpg`,
    clip_url: `/media/${id}.mp4`,
    timeline: [
      {
        at: new Date().toISOString(),
        action: 'call_placed' as const,
        to: ['Ravi Kumar', 'Anand Pillai', 'Suresh Nair'][Math.floor(Math.random() * 3)],
      },
    ],
  }
}

/* ── Real WS client ─────────────────────────────────────── */

export class SafetyWsClient {
  private ws: WebSocket | null = null
  private handlers: WsHandler[] = []
  private mockInterval: ReturnType<typeof setInterval> | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private stopped = false

  constructor() {}

  subscribe(handler: WsHandler): () => void {
    this.handlers.push(handler)
    return () => {
      this.handlers = this.handlers.filter(h => h !== handler)
    }
  }

  private emit(event: WsEvent) {
    this.handlers.forEach(h => h(event))
  }

  connect() {
    if (this.stopped) return

    if (USE_MOCKS) {
      this.mockInterval = setInterval(() => {
        this.emit({ event: 'new_incident', data: makeMockIncident() })
      }, 20_000)
      return
    }

    const wsUrl = API_URL.replace(/^http/, 'ws') + '/ws/events'
    this.ws = new WebSocket(wsUrl)

    this.ws.onmessage = (e: MessageEvent<string>) => {
      try {
        const parsed = JSON.parse(e.data) as WsEvent
        this.emit(parsed)
      } catch {
        // ignore malformed messages
      }
    }

    this.ws.onclose = () => {
      if (!this.stopped) {
        this.reconnectTimer = setTimeout(() => this.connect(), 5000)
      }
    }

    this.ws.onerror = () => {
      this.ws?.close()
    }
  }

  disconnect() {
    this.stopped = true
    if (this.mockInterval) clearInterval(this.mockInterval)
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    this.ws?.close()
  }
}

/* ── Singleton ─────────────────────────────────────────── */

export const wsClient = new SafetyWsClient()
