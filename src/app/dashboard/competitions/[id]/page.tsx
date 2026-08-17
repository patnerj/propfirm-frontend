'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Trophy, ArrowLeft, Swords } from 'lucide-react'

export default function CompetitionLeaderboardPage() {
  const params = useParams()
  const router = useRouter()
  const compId = Number(params.id)
  
  const [comp, setComp] = useState<any>(null)
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [compId])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [compRes, leadRes] = await Promise.all([
        api.competitions.getById(compId),
        api.competitions.leaderboard(compId)
      ])
      
      if (compRes.ok) {
        setComp(compRes.data)
      } else {
        toast.error('Failed to load competition details')
      }
      
      if (leadRes.ok) {
        setLeaderboard(leadRes.data || [])
      }
    } catch (e) {
      toast.error('Error loading data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-12 w-1/3 bg-surface-muted rounded" />
        <Card className="h-64 bg-surface-muted" />
      </div>
    )
  }

  if (!comp) {
    return <div>Competition not found</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push('/dashboard/competitions')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <h1 className="text-3xl font-bold tracking-tight text-text flex-1">{comp.name}</h1>
        <Badge tone={comp.status === 'active' ? 'success' : 'info'}>
          {comp.status.toUpperCase()}
        </Badge>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="bg-surface border-border md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Competition Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-text-muted">Prize Pool</span>
              <span className="text-accent font-bold flex items-center gap-1">
                <Trophy className="h-4 w-4" /> {comp.prize_pool}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-text-muted">Start Date</span>
              <span className="text-text font-medium">{new Date(comp.start_date).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-text-muted">End Date</span>
              <span className="text-text font-medium">{new Date(comp.end_date).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-t border-border-subtle pt-4">
              <span className="text-text-muted">Entry Fee</span>
              <span className="text-text font-medium">{Number(comp.entry_fee) === 0 ? 'Free' : `$${comp.entry_fee}`}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-surface border-border md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Swords className="h-5 w-5" /> Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leaderboard.length === 0 ? (
              <div className="text-center py-8 text-text-muted">
                No participants on the leaderboard yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-text-muted uppercase bg-surface-muted/50 border-b border-border">
                    <tr>
                      <th className="px-4 py-3">Rank</th>
                      <th className="px-4 py-3">Trader</th>
                      <th className="px-4 py-3 text-right">Profit / Loss</th>
                      <th className="px-4 py-3 text-right">Return %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((row, idx) => {
                      const isProfit = Number(row.profit) >= 0;
                      return (
                        <tr key={idx} className="border-b border-border-subtle hover:bg-surface-muted/50 transition-colors">
                          <td className="px-4 py-3 font-medium">
                            {idx + 1 === 1 ? <Trophy className="h-5 w-5 text-warn" /> : 
                             idx + 1 === 2 ? <Trophy className="h-5 w-5 text-text-muted" /> : 
                             idx + 1 === 3 ? <Trophy className="h-5 w-5 text-warn/70" /> : 
                             `#${idx + 1}`}
                          </td>
                          <td className="px-4 py-3 font-medium text-text">{row.trader_name}</td>
                          <td className={`px-4 py-3 text-right font-bold ${isProfit ? 'text-success' : 'text-danger'}`}>
                            {isProfit ? '+' : '-'}${Math.abs(Number(row.profit)).toFixed(2)}
                          </td>
                          <td className={`px-4 py-3 text-right font-medium ${isProfit ? 'text-success' : 'text-danger'}`}>
                            {isProfit ? '+' : '-'}{Math.abs(Number(row.return_pct)).toFixed(2)}%
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
