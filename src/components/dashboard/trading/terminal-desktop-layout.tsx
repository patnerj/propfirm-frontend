'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import {
  Panel, Group as PanelGroup, Separator as PanelResizeHandle,
} from 'react-resizable-panels'

import type { Account, Position, PendingOrder, ChallengeAccount } from '@/types/api'
import { cn } from '@/lib/cn'
import { STORAGE_KEYS } from '@/lib/storage'
import { useCollapsiblePanel } from '@/hooks/use-collapsible-panel'
import { SectionErrorBoundary } from '@/components/ui/section-error-boundary'

import { MarketWatch }        from '@/components/dashboard/trading/market-watch'
import { ChartPanel }         from '@/components/dashboard/trading/chart-panel'
import { OrderTicket }        from '@/components/dashboard/trading/order-ticket'
import { PositionsTable }     from '@/components/dashboard/trading/positions-table'
import { PendingOrdersTable } from '@/components/dashboard/trading/pending-orders-table'
import { AccountStrip }       from '@/components/dashboard/trading/account-strip'

type Tab = 'positions' | 'pending'

interface Props {
  account: Account | null
  challenge: ChallengeAccount | null
  openPnL: number
  positions: Position[] | null
  pending: PendingOrder[] | null
  metrics?: import('@/types/api').ChallengeMetrics | null
}

export function TerminalDesktopLayout({ account, challenge, openPnL, positions, pending, metrics }: Props) {
  const [tab, setTab] = useState<Tab>('positions')

  const mw  = useCollapsiblePanel(STORAGE_KEYS.termMw, 5)
  const pos = useCollapsiblePanel(STORAGE_KEYS.termPos, 6)

  const pendingCount = pending?.filter((o) => o.status === 'pending').length ?? 0

  const onTabKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault()
      setTab((t) => (t === 'positions' ? 'pending' : 'positions'))
    }
  }

  return (
    <div className="flex flex-col gap-3 h-[calc(100dvh-6.5rem)] min-h-[640px]">
      <AccountStrip account={account} openPnL={openPnL} metrics={metrics} />

      <PanelGroup
        orientation="horizontal"
        className="flex-1 min-h-0 w-full rounded-lg"
      >
        {/* Left: market watch */}
        <Panel
          id="term-mw"
          panelRef={mw.panelRef}
          defaultSize="24"
          minSize="18"
          maxSize="30"
          collapsible
          collapsedSize="4"
          onResize={mw.onResize}
        >
          {mw.collapsed ? (
            <aside className="rounded-lg border border-border bg-surface flex flex-col items-center py-2 h-full overflow-hidden select-none">
              <button
                onClick={mw.toggle}
                className="h-8 w-8 inline-flex items-center justify-center rounded text-text-muted hover:text-text hover:bg-surface-muted focus-ring shrink-0"
                aria-label="Show market watch"
                title="Show market watch"
              >
                <PanelLeftOpen className="h-4 w-4" />
              </button>
              <span className="mt-3 text-2xs font-semibold uppercase tracking-wider text-text-faint [writing-mode:vertical-rl] whitespace-nowrap">
                Market watch
              </span>
            </aside>
          ) : (
            <aside className="rounded-lg border border-border bg-surface flex flex-col h-full min-h-0 overflow-hidden">
              <div className="shrink-0 px-3 py-2.5 border-b border-border-subtle flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">Market watch</h3>
                <button
                  onClick={mw.toggle}
                  className="h-6 w-6 inline-flex items-center justify-center rounded text-text-muted hover:text-text hover:bg-surface-muted focus-ring"
                  aria-label="Hide market watch"
                  title="Hide market watch"
                >
                  <PanelLeftClose className="h-3.5 w-3.5" />
                </button>
              </div>
              <SectionErrorBoundary>
                <MarketWatch />
              </SectionErrorBoundary>
            </aside>
          )}
        </Panel>

        <PanelResizeHandle className="w-3 relative group">
          <div className="absolute inset-y-0 left-1.5 w-px bg-border-subtle group-hover:bg-accent transition-colors" />
        </PanelResizeHandle>

        {/* Center: chart + tabs */}
        <Panel id="term-center" defaultSize="52" minSize="40" className="min-w-0">
          <PanelGroup orientation="vertical">
            <Panel defaultSize="70" minSize="30">
              <section className="rounded-lg border border-border bg-surface overflow-hidden flex flex-col h-full min-h-0">
                <SectionErrorBoundary>
                  <ChartPanel positions={positions} plan={(account as any)?.plan || (challenge as any)?.plan || metrics?.plan} />
                </SectionErrorBoundary>
              </section>
            </Panel>

            <PanelResizeHandle className="h-3 relative group">
              <div className="absolute inset-x-0 top-1.5 h-px bg-border-subtle group-hover:bg-accent transition-colors" />
            </PanelResizeHandle>

            <Panel
              panelRef={pos.panelRef}
              defaultSize="30"
              minSize="10"
              collapsible
              collapsedSize="5"
              onResize={pos.onResize}
            >
              <section className="rounded-lg border border-border bg-surface overflow-hidden flex flex-col h-full min-h-0">
                <div
                  role="tablist"
                  aria-label="Open positions and pending orders"
                  onKeyDown={onTabKeyDown}
                  className="shrink-0 flex items-center gap-1 px-3 pt-2 border-b border-border-subtle"
                >
                  <TabButton active={tab === 'positions'} onClick={() => setTab('positions')} controls="term-tabpanel">
                    Positions
                    {positions && positions.length > 0 && (
                      <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-muted text-accent text-2xs font-medium px-1">
                        {positions.length}
                      </span>
                    )}
                  </TabButton>
                  <TabButton active={tab === 'pending'} onClick={() => setTab('pending')} controls="term-tabpanel">
                    Pending
                    {pendingCount > 0 && (
                      <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-warn-muted text-warn text-2xs font-medium px-1">
                        {pendingCount}
                      </span>
                    )}
                  </TabButton>
                  <button
                    onClick={pos.toggle}
                    className="ml-auto h-6 w-6 inline-flex items-center justify-center rounded text-text-muted hover:text-text hover:bg-surface-muted focus-ring"
                    aria-label={pos.collapsed ? 'Expand positions panel' : 'Collapse positions panel'}
                    title={pos.collapsed ? 'Expand positions panel' : 'Collapse positions panel'}
                  >
                    {pos.collapsed
                      ? <PanelLeftOpen className="h-3.5 w-3.5 rotate-90" />
                      : <PanelLeftClose className="h-3.5 w-3.5 rotate-90" />}
                  </button>
                </div>
                {!pos.collapsed && (
                  <div id="term-tabpanel" role="tabpanel" className="flex-1 overflow-y-auto min-h-0">
                    <SectionErrorBoundary>
                      {tab === 'positions'
                        ? <PositionsTable positions={positions} />
                        : <PendingOrdersTable orders={pending} />}
                    </SectionErrorBoundary>
                  </div>
                )}
              </section>
            </Panel>
          </PanelGroup>
        </Panel>

        <PanelResizeHandle className="w-3 relative group">
          <div className="absolute inset-y-0 left-1.5 w-px bg-border-subtle group-hover:bg-accent transition-colors" />
        </PanelResizeHandle>

        {/* Right: order ticket */}
        <Panel id="term-ticket" defaultSize="24" minSize="18" maxSize="30" className="min-w-0">
          <aside className="rounded-lg border border-border bg-surface overflow-hidden flex flex-col h-full min-h-0">
            <div className="shrink-0 px-3 py-2.5 border-b border-border-subtle">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">New order</h3>
            </div>
            <SectionErrorBoundary>
              <OrderTicket account={account} challenge={challenge} />
            </SectionErrorBoundary>
          </aside>
        </Panel>
      </PanelGroup>
    </div>
  )
}

function TabButton({ children, active, onClick, controls }: {
  children: React.ReactNode; active: boolean; onClick: () => void; controls: string
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      aria-controls={controls}
      tabIndex={active ? 0 : -1}
      onClick={onClick}
      className={cn(
        'relative h-9 px-3 text-xs font-medium transition-colors focus-ring',
        active ? 'text-text' : 'text-text-muted hover:text-text',
      )}
    >
      {children}
      {active && (
        <motion.span
          layoutId="trading-tab-indicator"
          className="absolute inset-x-0 -bottom-px h-0.5 bg-accent rounded-full"
          transition={{ type: 'spring', damping: 28, stiffness: 380 }}
        />
      )}
    </button>
  )
}
