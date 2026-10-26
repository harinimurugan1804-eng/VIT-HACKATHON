/**
 * lib/ws.ts
 * WebSocket client for /ws/events?token=<token>.
 * Handles real-time incident updates, roll-call notices, and emergency alerts.
 * In mock mode (VITE_USE_MOCKS=true), emits simulated events periodically.
 */

import type { WsEvent, Incident } from './types'
import { getAuthToken, clearAuthSession, resolveMediaUrl } from './api'

export type WsHandler = (event: WsEvent) => void

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true'
const API_URL   = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000').replace(/\/+$/, '')

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
    snapshot_url: resolveMediaUrl(`/media/${id}.jpg`),
    clip_url: resolveMediaUrl(`/media/${id}.mp4`),
    timeline: [
      {
        at: new Date().toISOString(),
        action: 'call_placed',
        to: ['Ravi Kumar', 'Anand Pillai', 'Suresh Nair'][Math.floor(Math.random() * 3)],
      },
    ],
  }
}

/* ── SafetyWsClient ─────────────────────────────────────── */

export class SafetyWsClient {
  private ws: WebSocket | null = null
  private handlers: WsHandler[] = []
  private mockInterval: ReturnType<typeof setInterval> | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private stopped = false

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
    this.stopped = false

    if (USE_MOCKS) {
      if (this.mockInterval) clearInterval(this.mockInterval)
      this.mockInterval = setInterval(() => {
        this.emit({ event: 'new_incident', data: makeMockIncident() })
      }, 20_000)
      return
    }

    const token = getAuthToken()
    if (!token) {
      // Cannot connect without token per CONTRACT.md P5
      return
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    const wsBase = API_URL.replace(/^http/, 'ws')
    const wsUrl = `${wsBase}/ws/events?token=${encodeURIComponent(token)}`
    
    try {
      this.ws = new WebSocket(wsUrl)
    } catch {
      this.scheduleReconnect()
      return
    }

    this.ws.onmessage = (e: MessageEvent<string>) => {
      try {
        const parsed = JSON.parse(e.data)
        // Normalize media URLs if it's an incident object
        if (parsed && typeof parsed === 'object') {
          if ('snapshot_url' in parsed && typeof parsed.snapshot_url === 'string') {
            parsed.snapshot_url = resolveMediaUrl(parsed.snapshot_url)
          }
          if ('clip_url' in parsed && typeof parsed.clip_url === 'string') {
            parsed.clip_url = resolveMediaUrl(parsed.clip_url)
          }
          if (parsed.data && typeof parsed.data === 'object') {
            if ('snapshot_url' in parsed.data && typeof parsed.data.snapshot_url === 'string') {
              parsed.data.snapshot_url = resolveMediaUrl(parsed.data.snapshot_url)
            }
            if ('clip_url' in parsed.data && typeof parsed.data.clip_url === 'string') {
              parsed.data.clip_url = resolveMediaUrl(parsed.data.clip_url)
            }
          }
        }
        this.emit(parsed as WsEvent)
      } catch {
        // ignore malformed messages
      }
    }

    this.ws.onclose = (event: CloseEvent) => {
      // CONTRACT.md P5: code 4401 means expired or bad token
      if (event.code === 4401) {
        clearAuthSession()
        return
      }

      if (!this.stopped) {
        this.scheduleReconnect()
      }
    }

    this.ws.onerror = () => {
      this.ws?.close()
    }
  }

  private scheduleReconnect() {
    if (this.stopped) return
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    this.reconnectTimer = setTimeout(() => {
      const token = getAuthToken()
      if (token) {
        this.connect()
      }
    }, 5000)
  }

  disconnect() {
    this.stopped = true
    if (this.mockInterval) {
      clearInterval(this.mockInterval)
      this.mockInterval = null
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
}

/* ── Singleton ─────────────────────────────────────────── */

export const wsClient = new SafetyWsClient()
