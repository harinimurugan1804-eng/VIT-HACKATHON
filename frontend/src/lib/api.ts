/**
 * lib/api.ts
 * All API calls for SafetyAI.
 * When VITE_USE_MOCKS=true every function returns mock data.
 */

import type {
  Camera,
  EventFilters,
  HealthResponse,
  Incident,
  Responder,
  StatsResponse,
  AssistantQueryResponse,
  AssistantVoiceResponse,
  ZonePayload,
} from './types'

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true'
const API_URL   = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

/* ── Helpers ──────────────────────────────────────────── */

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`)
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`)
  return res.json() as Promise<T>
}

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`POST ${path} → ${res.status}`)
  return res.json() as Promise<T>
}

async function put<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`PUT ${path} → ${res.status}`)
  return res.json() as Promise<T>
}

async function del<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`DELETE ${path} → ${res.status}`)
  return res.json() as Promise<T>
}

async function postForm<T>(path: string, form: FormData): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { method: 'POST', body: form })
  if (!res.ok) throw new Error(`POST ${path} → ${res.status}`)
  return res.json() as Promise<T>
}

/* ── Mock loaders ─────────────────────────────────────── */

async function mockIncidents(): Promise<Incident[]> {
  const mod = await import('../mocks/incidents.json')
  return mod.default as Incident[]
}

async function mockCameras(): Promise<Camera[]> {
  const mod = await import('../mocks/cameras.json')
  return mod.default as Camera[]
}

async function mockResponders(): Promise<Responder[]> {
  const mod = await import('../mocks/responders.json')
  return mod.default as Responder[]
}

async function mockStats(): Promise<StatsResponse> {
  const mod = await import('../mocks/stats.json')
  return mod.default as StatsResponse
}

/* ── Health ───────────────────────────────────────────── */

export async function fetchHealth(): Promise<HealthResponse> {
  if (USE_MOCKS) {
    const cameras = await mockCameras()
    return {
      cameras: cameras.map(c => ({ id: c.id, online: c.online, fps: c.fps })),
      db: true,
      twilio: true,
      llm: true,
    }
  }
  return get<HealthResponse>('/health')
}

/* ── Cameras ───────────────────────────────────────────── */

export async function fetchCameras(): Promise<Camera[]> {
  if (USE_MOCKS) return mockCameras()
  return get<Camera[]>('/cameras')
}

export function getStreamUrl(cameraId: string): string {
  return `${API_URL}/stream/${cameraId}`
}

/* ── Events ────────────────────────────────────────────── */

export async function fetchEvents(filters?: EventFilters): Promise<Incident[]> {
  if (USE_MOCKS) {
    let list = await mockIncidents()
    if (filters?.type)     list = list.filter(i => i.type === filters.type)
    if (filters?.camera)   list = list.filter(i => i.camera_id === filters.camera)
    if (filters?.severity) list = list.filter(i => i.severity === filters.severity)
    if (filters?.status)   list = list.filter(i => i.status === filters.status)
    if (filters?.search) {
      const q = filters.search.toLowerCase()
      list = list.filter(i =>
        i.camera_name.toLowerCase().includes(q) ||
        i.type.toLowerCase().includes(q) ||
        i.zone.toLowerCase().includes(q),
      )
    }
    return list.sort(
      (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime(),
    )
  }

  const params = new URLSearchParams()
  if (filters?.type)     params.set('type', filters.type)
  if (filters?.camera)   params.set('camera', filters.camera)
  if (filters?.severity) params.set('severity', filters.severity)
  if (filters?.status)   params.set('status', filters.status)
  if (filters?.from)     params.set('from', filters.from)
  if (filters?.to)       params.set('to', filters.to)
  const qs = params.toString()
  return get<Incident[]>(`/events${qs ? `?${qs}` : ''}`)
}

export async function fetchEvent(id: number): Promise<Incident> {
  if (USE_MOCKS) {
    const list = await mockIncidents()
    const inc = list.find(i => i.id === id)
    if (!inc) throw new Error(`Mock: incident ${id} not found`)
    return inc
  }
  return get<Incident>(`/events/${id}`)
}

export async function acknowledgeEvent(id: number): Promise<Incident> {
  if (USE_MOCKS) {
    const inc = await fetchEvent(id)
    return { ...inc, status: 'acknowledged' }
  }
  return post<Incident>(`/events/${id}/ack`)
}

export async function resolveEvent(
  id: number,
  outcome: 'resolved' | 'false_alarm',
  note: string,
): Promise<Incident> {
  if (USE_MOCKS) {
    const inc = await fetchEvent(id)
    return { ...inc, status: outcome }
  }
  return post<Incident>(`/events/${id}/resolve`, { outcome, note })
}

/* ── Zones ─────────────────────────────────────────────── */

export async function fetchZones(): Promise<ZonePayload[]> {
  if (USE_MOCKS) {
    const cameras = await mockCameras()
    return cameras.map(c => ({ camera_id: c.id, zones: c.zones }))
  }
  return get<ZonePayload[]>('/zones')
}

export async function saveZones(payload: ZonePayload): Promise<ZonePayload> {
  if (USE_MOCKS) return Promise.resolve(payload)
  return put<ZonePayload>('/zones', payload)
}

/* ── Responders ─────────────────────────────────────────── */

export async function fetchResponders(): Promise<Responder[]> {
  if (USE_MOCKS) return mockResponders()
  return get<Responder[]>('/responders')
}

export async function createResponder(r: Omit<Responder, 'id'>): Promise<Responder> {
  if (USE_MOCKS) return { ...r, id: `resp-${Date.now()}` }
  return post<Responder>('/responders', r)
}

export async function updateResponder(r: Responder): Promise<Responder> {
  if (USE_MOCKS) return r
  return put<Responder>(`/responders/${r.id}`, r)
}

export async function deleteResponder(id: string): Promise<void> {
  if (USE_MOCKS) return
  await del<void>(`/responders/${id}`)
}

/* ── Stats ──────────────────────────────────────────────── */

export async function fetchStats(): Promise<StatsResponse> {
  if (USE_MOCKS) return mockStats()
  return get<StatsResponse>('/stats')
}

/* ── Assistant ──────────────────────────────────────────── */

export async function queryAssistant(question: string): Promise<AssistantQueryResponse> {
  if (USE_MOCKS) {
    const incidents = (await mockIncidents()).slice(0, 3)
    return {
      answer: `Based on today's monitoring data, I found ${incidents.length} relevant incidents matching your query: "${question}". The most recent critical event was a fire alert at East Wing, Loading Bay 2.`,
      incidents,
    }
  }
  return post<AssistantQueryResponse>('/assistant/query', { question })
}

export async function queryAssistantVoice(audio: Blob): Promise<AssistantVoiceResponse> {
  if (USE_MOCKS) {
    const incidents = (await mockIncidents()).slice(0, 2)
    return {
      transcript: '(mock voice) Show me fire incidents from today',
      answer: `I found ${incidents.length} fire-related incidents in the past 24 hours.`,
      incidents,
    }
  }
  const form = new FormData()
  form.append('audio', audio, 'query.webm')
  return postForm<AssistantVoiceResponse>('/assistant/voice', form)
}

/* ── Broadcast ──────────────────────────────────────────── */

export async function broadcastMessage(audio: Blob, zone: string): Promise<void> {
  if (USE_MOCKS) return
  const form = new FormData()
  form.append('audio', audio, 'broadcast.webm')
  form.append('zone', zone)
  await postForm<void>('/broadcast', form)
}
