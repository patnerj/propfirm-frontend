'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Users, Trophy } from 'lucide-react'
import { api } from '@/lib/api'
import type { Competition, LeaderboardRow } from '@/types/api'

export default function AdminTournamentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = Number(params.id)

  const [tournament, setTournament] = useState<Competition | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) fetchDetails()
  }, [id])

  const fetchDetails = async () => {
    try {
      const [tRes, lRes] = await Promise.all([
        api.admin.competitions.get(id),
        api.competitions.leaderboard(id) // use public leaderboard for admin view for now
      ])
      
      if (tRes.ok) setTournament(tRes.data)
      if (lRes.ok) setLeaderboard(lRes.data)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-8 text-center animate-pulse text-text-muted">Loading tournament details...</div>
  if (!tournament) return <div className="p-8 text-center text-danger">Tournament not found</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 bg-surface border border-border rounded-md text-text-muted hover:text-text transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-text flex items-center gap-2">
            <Trophy className="h-6 w-6 text-accent" />
            {tournament.name}
          </h1>
          <p className="text-sm text-text-muted">Manage participants and view standings</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface border border-border p-4 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-sm text-text-muted">Status</div>
            <div className="font-semibold capitalize text-text mt-1">{tournament.status}</div>
          </div>
        </div>
        <div className="bg-surface border border-border p-4 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-sm text-text-muted">Prize Pool</div>
            <div className="font-semibold text-accent mt-1">{tournament.prize_pool}</div>
          </div>
        </div>
        <div className="bg-surface border border-border p-4 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-sm text-text-muted">Participants</div>
            <div className="font-semibold text-text mt-1 flex items-center gap-2">
              <Users className="h-4 w-4 text-info" />
              {tournament.participants_count ?? leaderboard.length}
            </div>
          </div>
        </div>
        <div className="bg-surface border border-border p-4 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-sm text-text-muted">Start Balance</div>
            <div className="font-semibold text-text mt-1">${tournament.starting_balance ?? tournament.initial_balance ?? 100000}</div>
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border/50 flex justify-between items-center bg-surface-muted/30">
          <h3 className="font-semibold text-text">Participants Leaderboard</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-surface-muted/50 border-b border-border/50 text-text-muted">
              <tr>
                <th className="px-6 py-4 font-semibold">Rank</th>
                <th className="px-6 py-4 font-semibold">Trader Name</th>
                <th className="px-6 py-4 font-semibold">Current Balance</th>
                <th className="px-6 py-4 font-semibold">Profit %</th>
                <th className="px-6 py-4 font-semibold">Trading Days</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {leaderboard.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-text-muted">
                    No participants yet.
                  </td>
                </tr>
              ) : (
                leaderboard.map((row, index) => (
                  <tr key={index} className="hover:bg-surface-muted/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-text">#{index + 1}</td>
                    <td className="px-6 py-4 font-medium text-info">{row.trader_name}</td>
                    <td className="px-6 py-4 font-mono">${row.current_balance}</td>
                    <td className={`px-6 py-4 font-medium ${Number(row.profit_pct) >= 0 ? 'text-success' : 'text-danger'}`}>
                      {Number(row.profit_pct) > 0 ? '+' : ''}{row.profit_pct}%
                    </td>
                    <td className="px-6 py-4">{row.trading_days}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
