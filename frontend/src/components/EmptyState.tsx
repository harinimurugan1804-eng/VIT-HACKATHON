/**
 * components/EmptyState.tsx
 * Empty state with an icon, title, and one helpful line of copy.
 */

import { type LucideIcon, Inbox } from 'lucide-react'

interface Props {
  icon?: LucideIcon
  title: string
  description: string
  action?: React.ReactNode
}

export function EmptyState({ icon: Icon = Inbox, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
        style={{ background: 'var(--accent-subtle)' }}
      >
        <Icon className="w-7 h-7 text-[var(--accent)]" aria-hidden="true" />
      </div>
      <h2 className="text-base font-semibold text-[var(--text-primary)] mb-1">{title}</h2>
      <p className="text-sm text-[var(--text-secondary)] max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
