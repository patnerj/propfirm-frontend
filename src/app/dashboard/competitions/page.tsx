'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/ui/page-header'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'
import { Trophy, Clock, ArrowRight, Swords } from 'lucide-react'

export default function CompetitionsPage() {
  const { data: compsList, isPending, refetch: fetchComps } = useQuery({
    queryKey: ['competitions'],
    queryFn: async () => {
      const res = await api.competitions.list()
      if (res.ok) return res.data || []
      throw new Error(res.error || 'Failed to load competitions')
    }
  })

  const loading = isPending && !compsList
  const comps = compsList || []

  const handleRegister = async (compId: number) => {
    const res = await api.competitions.register(compId)
    if (res.ok) {
      if (res.data?.checkout_required && res.data?.checkout_url) {
        toast.loading('Redirecting to checkout...')
        window.location.href = res.data.checkout_url
      } else {
        toast.success('Successfully registered for competition! Account provisioned.')
        fetchComps()
      }
    } else {
      toast.error(res.error || 'Registration failed')
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        variant="hero"
        title="Live Competitions"
        description="Compete against other traders for prizes and glory."
        icon={Swords}
        badge={{ label: 'Leaderboard', tone: 'accent' }}
      />

      {loading ? (
        <div className="grid md:grid-cols-2 gap-4 animate-pulse">
          <Card className="h-48 bg-surface-muted" />
          <Card className="h-48 bg-surface-muted" />
        </div>
      ) : comps.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <div className="inline-flex h-12 w-12 rounded-xl bg-accent/10 text-accent items-center justify-center mb-4">
              <Swords className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-semibold tracking-tight text-text">No active competitions</h2>
            <p className="text-sm text-text-muted mt-2 max-w-md mx-auto leading-relaxed">
              Check back later for upcoming trading competitions.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {comps.map((comp) => (
            <Card key={comp.id} className="bg-surface border-border/60 overflow-hidden relative group">
              <div className="absolute top-4 right-4">
                <Badge tone={comp.status === 'active' ? 'success' : 'info'}>
                  {comp.status.toUpperCase()}
                </Badge>
              </div>
              <CardHeader>
                <CardTitle className="text-xl text-text pr-16">{comp.name}</CardTitle>
                <div className="text-sm text-text-muted flex items-center gap-4 mt-2">
                  <span className="flex items-center gap-1"><Trophy className="h-4 w-4 text-accent" /> {comp.prize_pool} Prize Pool</span>
                  <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {new Date(comp.start_date).toLocaleDateString()}</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm border-b border-border-subtle pb-3">
                    <span className="text-text-muted">Registration ends</span>
                    <span className="text-text font-medium">{new Date(comp.end_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-text-muted">Entry Fee</span>
                    <span className="text-text font-medium">{Number(comp.entry_fee) === 0 ? 'Free' : `$${comp.entry_fee}`}</span>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <Button 
                      onClick={() => handleRegister(comp.id)}
                      className="flex-1" 
                      variant={comp.status === 'upcoming' ? 'primary' : 'outline'}
                      disabled={comp.status === 'completed' || comp.joined}
                    >
                      {comp.joined ? 'Registered' : comp.status === 'completed' ? 'Ended' : 'Register'} <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <Button 
                      onClick={() => window.location.href = `/dashboard/competitions/${comp.id}`}
                      className="flex-1" 
                      variant="secondary"
                    >
                      Leaderboard
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
