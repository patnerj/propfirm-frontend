'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight, BarChart3, Clock, ListOrdered } from 'lucide-react'

import type { Account, Position, PendingOrder, ChallengeAccount } from '@/types/api'
import { cn } from '@/lib/cn'
import { useTerminal } from '@/store/terminal'
import { SectionErrorBoundary } from '@/components/ui/section-error-boundary'

import { MarketWatch }        from '@/components/dashboard/trading/market-watch'
import { ChartPanel }         from '@/components/dashboard/trading/chart-panel'
import { OrderTicket }        from '@/components/dashboard/trading/order-ticket'
import { PositionsTable }     from '@/components/dashboard/trading/positions-table'
import { PendingOrdersTable } from '@/components/dashboard/trading/pending-orders-table'
import { AccountStrip }       from '@/components/dashboard/trading/account-strip'
import { MobileBottomSheet }  from '@/components/dashboard/trading/mobile-bottom-sheet'

interface Props {
  account: Account | null
  challenge: ChallengeAccount | null
  openPnL: number
  positions: Position[] | null
  pending: PendingOrder[] | null
  metrics?: import('@/types/api').ChallengeMetrics | null
}

type Sheet = null | 'watchlist' | 'order' | 'positions' | 'pending'

export function TerminalMobileLayout({ account, challenge, openPnL, positions, pending, metrics }: Props) {
  const [sheet, setSheet] = useState<Sheet>(null)
  const active = useTerminal((s) => s.active)
  const pendingCount = pending?.filter((o) => o.status === 'pending').length

  return (
    <div className="flex flex-col gap-3 h-[calc(100dvh-6rem)] -mx-3 -my-3 md:-mx-4 md:-my-4">
      {/* Account strip — compact */}
      <div className="px-4 pt-4 shrink-0">
        <AccountStrip account={account} openPnL={openPnL} metrics={metrics} compact />
      </div>

      {/* Chart — fills remaining space */}
      <div className="flex-1 mx-4 rounded-lg border border-border overflow-hidden min-h-0">
        <SectionErrorBoundary>
          <ChartPanel compact positions={positions} plan={(account as any)?.plan || (challenge as any)?.plan || metrics?.plan} onOpenWatchlist={() => setSheet('watchlist')} />
        </SectionErrorBoundary>
      </div>

      {/* Bottom dock */}
      <div className="shrink-0 relative">
        <div className="grid grid-cols-3 gap-1 mx-4 mb-3 p-1 rounded-md bg-surface border border-border text-2xs">
          <DockButton icon={BarChart3} label="Markets" onClick={() => setSheet('watchlist')} />
          <DockButton icon={ListOrdered} label="Positions" count={positions?.length} onClick={() => setSheet('positions')} />
          <DockButton icon={Clock} label="Pending" count={pendingCount} onClick={() => setSheet('pending')} />
        </div>
      </div>

      {/* Floating order FAB */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 18, stiffness: 280, delay: 0.2 }}
        onClick={() => setSheet('order')}
        className={cn(
          'fixed right-4 z-30',
          'h-14 w-14 rounded-full bg-gradient-to-br from-accent to-success',
          'shadow-glow flex items-center justify-center',
          'focus-ring active:scale-95 transition-transform',
        )}
        style={{ bottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}
        aria-label="Open order ticket"
      >
        <span className="grid place-items-center text-white">
          <ArrowUpRight className="h-5 w-5" />
        </span>
      </motion.button>

      {/* Bottom sheets */}
      <MobileBottomSheet open={sheet === 'watchlist'} onClose={() => setSheet(null)} title="Markets" height={0.8}>
        <SectionErrorBoundary>
          <MarketWatch onPick={() => setSheet(null)} />
        </SectionErrorBoundary>
      </MobileBottomSheet>

      <MobileBottomSheet open={sheet === 'order'} onClose={() => setSheet(null)} title={`Trade ${active}`} height={0.92}>
        <SectionErrorBoundary>
          <OrderTicket compact account={account} challenge={challenge} onSubmitted={() => setSheet(null)} />
        </SectionErrorBoundary>
      </MobileBottomSheet>

      <MobileBottomSheet
        open={sheet === 'positions'}
        onClose={() => setSheet(null)}
        title={`Positions${positions?.length ? ` (${positions.length})` : ''}`}
        height={0.8}
      >
        <div className="flex-1 overflow-y-auto">
          <SectionErrorBoundary>
            <PositionsTable positions={positions} compact />
          </SectionErrorBoundary>
        </div>
      </MobileBottomSheet>

      <MobileBottomSheet open={sheet === 'pending'} onClose={() => setSheet(null)} title="Pending orders" height={0.8}>
        <div className="flex-1 overflow-y-auto">
          <SectionErrorBoundary>
            <PendingOrdersTable orders={pending} />
          </SectionErrorBoundary>
        </div>
      </MobileBottomSheet>
    </div>
  )
}

function DockButton({ icon: Icon, label, count, onClick }: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  count?: number
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="relative flex flex-col items-center justify-center gap-0.5 h-12 rounded text-text-muted hover:text-text hover:bg-surface-muted/50 focus-ring transition-colors active:scale-95"
    >
      <Icon className="h-4 w-4" />
      <span className="text-2xs font-medium">{label}</span>
      {count !== undefined && count > 0 && (
        <span className="absolute top-1 right-2 h-4 min-w-4 px-1 inline-flex items-center justify-center rounded-full bg-accent text-white text-2xs font-medium">
          {count}
        </span>
      )}
    </button>
  )
}
