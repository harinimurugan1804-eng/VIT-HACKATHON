/**
 * lib/types.ts
 * TypeScript types that mirror the API contract exactly.
 * All times from the API are UTC ISO-8601 strings.
 */

/* ── Enums ─────────────────────────────────────────────── */

export type IncidentType =
  | 'access'
  | 'ppe'
  | 'fall'
  | 'fire'
  | 'unattended'
  | 'loitering'
  | 'crowding'

export type Severity = 'critical' | 'high' | 'low'

export type IncidentStatus =
  | 'open'
  | 'acknowledged'
  | 'resolved'
  | 'false_alarm'

export type TimelineAction =
  | 'call_placed'
  | 'call_escalated'
  | 'acknowledged'
  | 'resolved'
  | 'false_alarm'
  | 'note_added'

/* ── Timeline event ────────────────────────────────────── */

export interface TimelineEvent {
  at: string            // UTC ISO-8601
  action: TimelineAction
  to?: string           // guard name (call_placed / call_escalated)
  by?: string           // guard name (acknowledged / resolved)
  via?: 'voice' | 'keypad' | 'web'
  note?: string
}

/* ── Incident ──────────────────────────────────────────── */

export interface Incident {
  id: number
  type: IncidentType
  severity: Severity
  status: IncidentStatus
  camera_id: string
  camera_name: string
  zone: string
  started_at: string        // UTC ISO-8601
  confidence: number        // 0–1
  snapshot_url: string
  clip_url: string
  acknowledged_by?: string
  timeline: TimelineEvent[]
}

/* ── Camera ────────────────────────────────────────────── */

export interface ZonePolygon {
  id: string
  name: string
  points: Array<{ x: number; y: number }>  // normalised 0–1 coordinates
  color?: string
}

export interface Camera {
  id: string
  name: string
  location: string
  stream_url: string
  snapshot_url: string
  online: boolean
  fps: number
  zones: ZonePolygon[]
}

/* ── Responder ─────────────────────────────────────────── */

export type Shift = 'morning' | 'afternoon' | 'night'
export type Language = 'Hindi' | 'Tamil' | 'Telugu' | 'Kannada' | 'Marathi' | 'English'

export interface Responder {
  id: string
  name: string
  phone: string
  language: Language
  zone: string
  shift: Shift
  call_order: number
  active: boolean
}

/* ── Health ────────────────────────────────────────────── */

export interface CameraHealth {
  id: string
  online: boolean
  fps: number
}

export interface HealthResponse {
  cameras: CameraHealth[]
  db: boolean
  twilio: boolean
  llm: boolean
}

/* ── Stats ─────────────────────────────────────────────── */

export interface IncidentTypeCount {
  type: IncidentType
  count: number
}

export interface DailyCount {
  date: string   // YYYY-MM-DD
  count: number
}

export interface StatsResponse {
  by_type: IncidentTypeCount[]
  by_day: DailyCount[]
  open_count: number
  resolved_count: number
  avg_response_seconds: number
}

/* ── Query filters ─────────────────────────────────────── */

export interface EventFilters {
  type?: IncidentType
  camera?: string
  severity?: Severity
  status?: IncidentStatus
  from?: string   // ISO-8601
  to?: string     // ISO-8601
  search?: string
}

/* ── Assistant ─────────────────────────────────────────── */

export interface AssistantQueryResponse {
  answer: string
  incidents: Incident[]
}

export interface AssistantVoiceResponse {
  transcript: string
  answer: string
  incidents: Incident[]
}

/* ── Zone API ──────────────────────────────────────────── */

export interface ZonePayload {
  camera_id: string
  zones: ZonePolygon[]
}

/* ── WS event ──────────────────────────────────────────── */

export type WsEvent =
  | { event: 'new_incident';     data: Incident }
  | { event: 'updated_incident'; data: Incident }
