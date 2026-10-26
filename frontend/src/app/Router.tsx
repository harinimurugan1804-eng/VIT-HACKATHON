/**
 * app/Router.tsx
 * All routes for SafetyAI. Every route is wrapped by Layout.
 */

import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './Layout'
import { LivePage }          from '@/pages/Live'
import { IncidentsPage }     from '@/pages/Incidents'
import { IncidentDetailPage } from '@/pages/IncidentDetail'
import { AssistantPage }     from '@/pages/Assistant'
import { RespondersPage }    from '@/pages/Responders'
import { ZonesPage }         from '@/pages/Zones'
import { OverviewPage }      from '@/pages/Overview'

export function Router() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/live" replace />} />
        <Route path="/live"            element={<LivePage />} />
        <Route path="/incidents"       element={<IncidentsPage />} />
        <Route path="/incidents/:id"   element={<IncidentDetailPage />} />
        <Route path="/assistant"       element={<AssistantPage />} />
        <Route path="/overview"        element={<OverviewPage />} />
        <Route path="/responders"      element={<RespondersPage />} />
        <Route path="/zones"           element={<ZonesPage />} />
        <Route path="*"                element={<Navigate to="/live" replace />} />
      </Route>
    </Routes>
  )
}
