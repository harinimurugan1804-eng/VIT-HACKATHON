/**
 * app/Layout.tsx
 * App shell: fixed left sidebar + top bar + scrollable content area.
 */

import { useState, useEffect } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  LayoutGrid,
  AlertTriangle,
  MessageSquare,
  Users,
  MapPin,
  BarChart3,
  Shield,
  Video,
  Wifi,
  WifiOff,
  ChevronLeft,
  ChevronRight,
  Database,
  Phone,
  Brain,
} from 'lucide-react'
import { APP_NAME } from '@/lib/constants'
import { fetchHealth } from '@/lib/api'
import { nowIST } from '@/lib/time'

const NAV = [
  { to: '/live',       icon: Video,        label: 'Live Feed'    },
  { to: '/incidents',  icon: AlertTriangle, label: 'Incidents'   },
  { to: '/assistant',  icon: MessageSquare, label: 'Assistant'   },
  { to: '/overview',   icon: BarChart3,     label: 'Overview'    },
  { to: '/responders', icon: Users,         label: 'Responders'  },
  { to: '/zones',      icon: MapPin,        label: 'Zones'       },
]

export function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const [time, setTime] = useState(nowIST())

  // Tick the clock every second
  useEffect(() => {
    const id = setInterval(() => setTime(nowIST()), 1000)
    return () => clearInterval(id)
  }, [])

  const { data: health } = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
    refetchInterval: 15_000,
  })

  const camerasOnline = health?.cameras.filter(c => c.online).length ?? 0
  const camerasTotal  = health?.cameras.length ?? 0
  const llmOnline     = health?.llm ?? false
  const dbOnline      = health?.db ?? false
  const twilioOnline  = health?.twilio ?? false

  return (
    <div className="flex h-dvh overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside
        className="flex flex-col shrink-0 h-full border-r transition-all duration-200"
        style={{
          width: collapsed ? '60px' : '220px',
          background: 'var(--surface)',
          borderColor: 'var(--border)',
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-4 py-4 border-b"
          style={{ borderColor: 'var(--border)', minHeight: '60px' }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'var(--accent)' }}
          >
            <Shield className="w-4 h-4 text-white" aria-hidden="true" />
          </div>
          {!collapsed && (
            <span className="font-semibold text-sm tracking-wide text-[var(--text-primary)] truncate">
              {APP_NAME}
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 overflow-hidden" aria-label="Main navigation">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 mx-2 my-0.5 px-3 py-2.5 rounded-[var(--radius-sm)] text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)] ${
                  isActive
                    ? 'text-[var(--text-primary)] bg-[var(--accent-subtle)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className="w-4 h-4 shrink-0"
                    style={{ color: isActive ? 'var(--accent)' : undefined }}
                    aria-hidden="true"
                  />
                  {!collapsed && <span className="truncate">{label}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Collapse toggle */}
        <div className="p-2 border-t" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={() => setCollapsed(c => !c)}
            className="w-full flex items-center justify-center p-2 rounded-[var(--radius-sm)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>
      </aside>

      {/* ── Main column ─────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Top bar */}
        <header
          className="flex items-center gap-4 px-5 border-b shrink-0"
          style={{
            height: '60px',
            background: 'var(--surface)',
            borderColor: 'var(--border)',
          }}
        >
          {/* Status pills */}
          <div className="flex items-center gap-3 flex-1 overflow-hidden">
            {/* Cameras */}
            <StatusPill
              icon={<LayoutGrid className="w-3 h-3" />}
              label={`Cameras ${camerasOnline}/${camerasTotal}`}
              online={camerasOnline === camerasTotal && camerasTotal > 0}
              title={`${camerasOnline} of ${camerasTotal} cameras online`}
            />
            {/* AI / LLM */}
            <StatusPill
              icon={<Brain className="w-3 h-3" />}
              label="AI"
              online={llmOnline}
              title={llmOnline ? 'AI inference online' : 'AI inference offline'}
            />
            {/* Database */}
            <StatusPill
              icon={<Database className="w-3 h-3" />}
              label="DB"
              online={dbOnline}
              title={dbOnline ? 'Database online' : 'Database offline'}
            />
            {/* Twilio */}
            <StatusPill
              icon={<Phone className="w-3 h-3" />}
              label="Calls"
              online={twilioOnline}
              title={twilioOnline ? 'Twilio online' : 'Twilio offline'}
            />
          </div>

          {/* Clock */}
          <time
            className="text-sm tabular text-[var(--text-secondary)] shrink-0 font-mono"
            aria-label={`Current time: ${time} IST`}
          >
            {time} <span className="text-[var(--text-muted)] text-xs">IST</span>
          </time>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-5 min-h-0" id="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

/* ── Status Pill ────────────────────────────────────────── */

interface StatusPillProps {
  icon: React.ReactNode
  label: string
  online: boolean
  title: string
}

function StatusPill({ icon, label, online, title }: StatusPillProps) {
  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
      style={{
        background: online ? 'var(--resolved-subtle)' : 'var(--neutral-subtle)',
        color: online ? 'var(--resolved)' : 'var(--neutral)',
        borderColor: online ? 'var(--resolved)' + '30' : 'var(--neutral)' + '30',
      }}
      title={title}
    >
      {online ? (
        <Wifi className="w-3 h-3 shrink-0" aria-hidden="true" />
      ) : (
        <WifiOff className="w-3 h-3 shrink-0" aria-hidden="true" />
      )}
      {icon}
      <span>{label}</span>
    </div>
  )
}
