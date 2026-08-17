'use client'

import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { api } from '@/lib/api'
import { fmtUSD, fmtDate, toNum, pnlClass } from '@/lib/format'
import type { Trade } from '@/types/api'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import { StatCard, StatGrid } from '@/components/ui/stat-card'
import { Search, ChevronDown, TrendingUp, TrendingDown, BarChart3, Tag, MessageSquare, Save, History, Trophy, Award, DollarSign } from 'lucide-react'
import { toast } from 'sonner'

export default function HistoryPage() {
  const queryClient = useQueryClient()
  
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage: loadingMore,
    isPending,
    error: queryError,
    refetch
  } = useInfiniteQuery({
    queryKey: ['history', 'infinite'],
    initialPageParam: null as number | null,
    queryFn: async ({ pageParam }) => {
      const res = await api.history(pageParam || undefined)
      if (!res.ok) throw new Error(res.error || 'Could not load trade history.')
      return res.data
    },
    getNextPageParam: (lastPage) => lastPage.has_more ? lastPage.next_cursor : undefined,
  })

  // Only consider loading if there's no data in cache yet
  const loading = isPending && !data

  const trades = data ? data.pages.flatMap(p => p.trades ?? []) : []
  const serverStats = data ? data.pages[0]?.stats : null
  const error = queryError ? queryError.message : null
  const hasMore = !!hasNextPage

  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'buy' | 'sell' | 'win' | 'loss'>('all')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [noteText, setNoteText] = useState('')
  const [tagsList, setTagsList] = useState<string[]>([])
  const [savingNote, setSavingNote] = useState(false)

  const handleSaveNote = async (id: number) => {
    setSavingNote(true)
    const res = await api.tradeNotesSave(id, { note: noteText, tags: tagsList, screenshot_url: '' })
    setSavingNote(false)
    if (res.ok) {
      toast.success('Trade note saved successfully.')
      queryClient.setQueryData(['history', 'infinite'], (oldData: any) => {
        if (!oldData) return oldData
        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            trades: (page.trades || []).map((tr: Trade) => tr.id === id ? { ...tr, note: noteText, tags: tagsList } : tr)
          }))
        }
      })
    } else {
      toast.error(res.error || 'Failed to save note')
    }
  }

  const loadMore = async () => {
    if (hasNextPage) {
      await fetchNextPage()
    }
  }

  const filtered = useMemo(() => trades.filter((t) => {
    if (query && !(t.symbol ?? '').toLowerCase().includes(query.toLowerCase())) return false
    if (filter === 'buy'  && t.type !== 'buy')  return false
    if (filter === 'sell' && t.type !== 'sell') return false
    if (filter === 'win'  && toNum(t.pnl) <= 0)  return false
    if (filter === 'loss' && toNum(t.pnl) >= 0)  return false
    return true
  }), [trades, query, filter])

  const stats = useMemo(() => {
    if (serverStats) {
      return {
        ...serverStats,
        wins: serverStats.wins ?? (serverStats as any).total_wins ?? 0,
        losses: serverStats.losses ?? (serverStats as any).total_losses ?? 0,
        total: serverStats.total ?? (serverStats as any).total_trades ?? 0,
        netPnL: serverStats.netPnL ?? (serverStats as any).net_pnl ?? 0,
        winRate: serverStats.winRate ?? (serverStats as any).win_rate ?? 0
      }
    }
    const wins   = trades.filter((t) => toNum(t.pnl) > 0).length
    const losses = trades.filter((t) => toNum(t.pnl) < 0).length
    const netPnL = trades.reduce((s, t) => s + toNum(t.pnl), 0)
    const winRate = trades.length ? (wins / trades.length) * 100 : 0
    return { wins, losses, total: trades.length, netPnL, winRate }
  }, [trades, serverStats])

  return (
    <div className="space-y-8">
      <PageHeader
        variant="hero"
        title="Trade history"
        description="All closed positions across your trading accounts."
        icon={History}
        badge={{ label: 'Performance', tone: 'accent' }}
      />

      {/* Summary Stat Grid */}
      <StatGrid columns={4}>
        <StatCard label="Total trades" value={String(stats.total)} icon={History} tone="accent" />
        <StatCard label="Win rate" value={`${stats.winRate.toFixed(1)}%`} icon={Trophy} tone="info" />
        <StatCard label="Wins / Losses" value={`${stats.wins} / ${stats.losses}`} icon={Award} tone="warn" />
        <StatCard
          label="Net P&L"
          value={fmtUSD(stats.netPnL, { sign: true })}
          icon={DollarSign}
          tone={stats.netPnL >= 0 ? 'success' : 'danger'}
        />
      </StatGrid>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter by symbol (e.g. EURUSD)"
              className="pl-9"
            />
          </div>
          <div className="flex gap-1 bg-surface-muted p-1 rounded-md text-2xs">
            {(['all', 'buy', 'sell', 'win', 'loss'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 h-8 rounded-md transition-colors focus-ring ${
                  filter === f ? 'bg-surface text-text font-semibold shadow-sm' : 'text-text-muted hover:text-text'
                }`}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle bg-bg-subtle/40">
                <th className="text-left  px-4 py-3 text-2xs uppercase tracking-wider text-text-muted font-semibold">Symbol</th>
                <th className="text-left  px-4 py-3 text-2xs uppercase tracking-wider text-text-muted font-semibold">Side</th>
                <th className="text-right px-4 py-3 text-2xs uppercase tracking-wider text-text-muted font-semibold hidden sm:table-cell">Lots</th>
                <th className="text-right px-4 py-3 text-2xs uppercase tracking-wider text-text-muted font-semibold hidden md:table-cell">Open</th>
                <th className="text-right px-4 py-3 text-2xs uppercase tracking-wider text-text-muted font-semibold hidden md:table-cell">Close</th>
                <th className="text-right px-4 py-3 text-2xs uppercase tracking-wider text-text-muted font-semibold">P&L</th>
                <th className="text-right px-4 py-3 text-2xs uppercase tracking-wider text-text-muted font-semibold hidden lg:table-cell">Closed</th>
              </tr>
            </thead>
            <tbody>
              {loading && Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-border-subtle/40">
                  <td colSpan={7} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                </tr>
              ))}
              {!loading && error && (
                <tr><td colSpan={7} className="text-center py-16">
                  <BarChart3 className="h-8 w-8 mx-auto text-danger/70 mb-3" />
                  <div className="text-sm text-text-muted">{error}</div>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>Try again</Button>
                </td></tr>
              )}
              {!loading && !error && filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-16">
                  <div className="inline-flex h-12 w-12 rounded-xl bg-accent-muted text-accent items-center justify-center mb-4">
                    <BarChart3 className="h-6 w-6" />
                  </div>
                  <h2 className="text-lg font-semibold tracking-tight">
                    {trades.length === 0 ? 'No closed trades yet' : 'No trades found'}
                  </h2>
                  <p className="text-sm text-text-muted mt-2 max-w-md mx-auto">
                    {trades.length === 0 ? 'Close a trade for it to appear in your history.' : 'No trades match your current filter.'}
                  </p>
                </td></tr>
              )}
              {!loading && !error && filtered.map((t, i) => {
                const pnl = toNum(t.pnl)
                const type = (t.type ?? '').toLowerCase()
                const isExpanded = expandedId === t.id
                return (
                  <React.Fragment key={t.id}>
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: Math.min(i * 0.01, 0.3) }}
                    onClick={async () => {
                      if (expandedId !== t.id) {
                        setNoteText(t.note || '')
                        setTagsList(t.tags || [])
                        setExpandedId(t.id)

                        if (t.note === undefined) {
                          const res = await api.tradeNotesGet(t.id)
                          if (res.ok) {
                            const newNote = res.data.note || ''
                            let newTags: string[] = []
                            try {
                              newTags = res.data.tags ? JSON.parse(res.data.tags) : []
                            } catch (e) {
                              newTags = []
                            }
                            setNoteText(newNote)
                            setTagsList(newTags)
                            queryClient.setQueryData(['history', 'infinite'], (oldData: any) => {
                              if (!oldData) return oldData
                              return {
                                ...oldData,
                                pages: oldData.pages.map((page: any) => ({
                                  ...page,
                                  trades: (page.trades || []).map((tr: Trade) => tr.id === t.id ? { ...tr, note: newNote, tags: newTags } : tr)
                                }))
                              }
                            })
                          }
                        }
                      } else {
                        setExpandedId(null)
                      }
                    }}
                    className="border-b border-border-subtle/40 last:border-0 hover:bg-surface-muted/30 cursor-pointer"
                  >
                    <td className="px-4 py-3 font-medium tabular">{t.symbol}</td>
                    <td className="px-4 py-3">
                      <Badge tone={type === 'buy' ? 'success' : 'danger'}>
                        {type === 'buy' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {(t.type ?? '—').toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right tabular text-text-muted hidden sm:table-cell">{toNum(t.lot_size).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right tabular text-text-muted hidden md:table-cell">{toNum(t.open_price).toFixed(5)}</td>
                    <td className="px-4 py-3 text-right tabular text-text-muted hidden md:table-cell">{toNum(t.close_price).toFixed(5)}</td>
                    <td className={`px-4 py-3 text-right tabular font-medium ${pnlClass(pnl)}`}>
                      {fmtUSD(pnl, { sign: true })}
                    </td>
                    <td className="px-4 py-3 text-right text-2xs text-text-muted hidden lg:table-cell">{fmtDate(t.closed_at_iso || t.closed_at, true)}</td>
                  </motion.tr>
                  {isExpanded && (
                    <tr className="bg-surface-muted/10 border-b border-border-subtle/40">
                      <td colSpan={7} className="p-0">
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }} 
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="px-6 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm overflow-hidden"
                        >
                          <div>
                            <div className="text-2xs text-text-muted uppercase tracking-wider mb-1">Open Time</div>
                            <div className="text-text-muted tabular">{fmtDate(t.opened_at_iso || t.opened_at, true)}</div>
                          </div>
                          <div>
                            <div className="text-2xs text-text-muted uppercase tracking-wider mb-1">Stop Loss</div>
                            <div className="text-text-muted tabular">{toNum(t.sl) ? toNum(t.sl).toFixed(5) : 'None'}</div>
                          </div>
                          <div>
                            <div className="text-2xs text-text-muted uppercase tracking-wider mb-1">Take Profit</div>
                            <div className="text-text-muted tabular">{toNum(t.tp) ? toNum(t.tp).toFixed(5) : 'None'}</div>
                          </div>
                          <div>
                            <div className="text-2xs text-text-muted uppercase tracking-wider mb-1">Commissions / Swap</div>
                            <div className="text-text-muted tabular">
                              {fmtUSD(toNum(t.commission))} / {fmtUSD(toNum(t.swap))}
                            </div>
                          </div>
                          <div className="col-span-2 sm:col-span-4 mt-4 pt-4 border-t border-border-subtle/40 grid sm:grid-cols-2 gap-6">
                            <div>
                              <div className="flex items-center gap-2 text-2xs text-text-muted uppercase tracking-wider mb-2">
                                <Tag className="w-3 h-3" /> Tags
                              </div>
                              <div className="flex gap-2 flex-wrap">
                                {tagsList.map(tag => (
                                  <Badge key={tag} tone="info" className="opacity-80 flex items-center gap-1">
                                    {tag}
                                    <span 
                                      className="cursor-pointer text-text-muted hover:text-text ml-1"
                                      onClick={(e) => { e.stopPropagation(); setTagsList(tagsList.filter(t => t !== tag)); }}
                                    >×</span>
                                  </Badge>
                                ))}
                                <input
                                  type="text"
                                  placeholder="+ Add tag (press Enter)"
                                  className="text-text text-xs bg-bg-subtle/50 px-2 py-1 rounded-md border border-transparent focus:border-border-subtle focus:outline-none w-36"
                                  onClick={(e) => e.stopPropagation()}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      const val = e.currentTarget.value.trim();
                                      if (val && !tagsList.includes(val)) {
                                        setTagsList([...tagsList, val]);
                                      }
                                      e.currentTarget.value = '';
                                    }
                                  }}
                                />
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2 text-2xs text-text-muted uppercase tracking-wider">
                                  <MessageSquare className="w-3 h-3" /> Journal Note
                                </div>
                                {(noteText !== (t.note || '') || JSON.stringify(tagsList) !== JSON.stringify(t.tags || [])) && (
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="h-6 text-xs px-2"
                                    onClick={(e) => { e.stopPropagation(); handleSaveNote(t.id); }}
                                    loading={savingNote}
                                  >
                                    <Save className="w-3 h-3 mr-1" /> Save
                                  </Button>
                                )}
                              </div>
                              <textarea
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                placeholder="Write down your thoughts, emotions, or screenshots link for this trade..."
                                className="w-full bg-bg-subtle/30 border border-border-subtle rounded-md p-2 text-xs text-text min-h-[60px] focus:outline-none focus:ring-1 focus:ring-accent/50"
                              />
                            </div>
                          </div>
                        </motion.div>
                      </td>
                    </tr>
                  )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>

        {hasMore && !loading && (
          <div className="border-t border-border-subtle p-4 text-center">
            <Button variant="outline" size="sm" loading={loadingMore} onClick={loadMore}>
              Load more <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}
