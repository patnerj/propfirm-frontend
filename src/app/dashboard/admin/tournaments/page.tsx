'use client'

import { useState, useEffect } from 'react'
import { Trophy, Plus, Edit, Trash2 } from 'lucide-react'
import { api } from '@/lib/api'
import type { Competition } from '@/types/api'
import { format } from 'date-fns'
import Link from 'next/link'

import { TournamentFormDialog } from '@/components/admin/tournament-form-dialog'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { toast } from 'sonner'

export default function AdminTournamentsPage() {
  const [tournaments, setTournaments] = useState<Competition[]>([])
  const [loading, setLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTournament, setEditingTournament] = useState<Competition | undefined>()
  const [tournamentToDelete, setTournamentToDelete] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    fetchTournaments()
  }, [])

  const fetchTournaments = async () => {
    try {
      const res = await api.admin.competitions.list()
      if (res.ok) setTournaments(res.data)
    } finally {
      setLoading(false)
    }
  }

  const confirmDelete = async () => {
    if (!tournamentToDelete) return
    setIsDeleting(true)
    try {
      const res = await api.admin.competitions.delete(tournamentToDelete)
      if (res.ok) {
        setTournaments(prev => prev.filter(t => t.id !== tournamentToDelete))
        toast.success('Tournament deleted successfully.')
        setTournamentToDelete(null)
      } else {
        toast.error('Failed to delete tournament.')
      }
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSave = async (data: Partial<Competition>) => {
    if (editingTournament) {
      const res = await api.admin.competitions.update(editingTournament.id, data)
      if (res.ok) fetchTournaments()
    } else {
      const res = await api.admin.competitions.create(data)
      if (res.ok) fetchTournaments()
    }
  }

  const openNewForm = () => {
    setEditingTournament(undefined)
    setIsFormOpen(true)
  }

  const openEditForm = (t: Competition) => {
    setEditingTournament(t)
    setIsFormOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Vibrant Header Banner */}
      <div className="relative isolate overflow-hidden bg-surface rounded-2xl border border-border p-6 sm:p-8">
        {/* Ambient background glow */}
        <div className="absolute -top-24 -right-24 -z-10 h-64 w-64 rounded-full bg-accent/30 blur-3xl opacity-60 mix-blend-screen animate-pulse" />
        <div className="absolute -bottom-24 -left-24 -z-10 h-64 w-64 rounded-full bg-info/20 blur-3xl opacity-60 mix-blend-screen" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 h-[150%] w-[150%] bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-accent to-accent-foreground drop-shadow-sm flex items-center gap-3">
              <Trophy className="h-8 w-8 text-accent" />
              Interactive Tournaments
            </h1>
            <p className="text-sm text-text-muted mt-2 max-w-xl leading-relaxed">
              Create, manage, and monitor trading competitions and tournaments.
            </p>
          </div>
          <div>
            <button 
              onClick={openNewForm}
              className="inline-flex items-center justify-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors shadow-sm gap-2"
            >
              <Plus className="h-4 w-4" />
              New Tournament
            </button>
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden relative">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-surface-muted/50 border-b border-border/50 text-text-muted">
              <tr>
                <th className="px-6 py-4 font-semibold">Title</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Duration</th>
                <th className="px-6 py-4 font-semibold">Prize Pool</th>
                <th className="px-6 py-4 font-semibold">Participants</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-text-muted animate-pulse">
                    Loading tournaments...
                  </td>
                </tr>
              ) : tournaments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-text-muted">
                    No tournaments found. Click 'New Tournament' to create one.
                  </td>
                </tr>
              ) : (
                tournaments.map((t) => (
                  <tr key={t.id} className="hover:bg-surface-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-text">{t.name}</div>
                      <div className="text-xs text-text-muted truncate max-w-[200px]">{t.description}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                        t.status === 'active' ? 'bg-success/10 text-success' :
                        t.status === 'completed' ? 'bg-info/10 text-info' :
                        'bg-warning/10 text-warning'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-text-muted">
                      {format(new Date(t.start_date), 'MMM d, yyyy')} - {format(new Date(t.end_date), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-accent font-medium">
                      {t.prize_pool}
                    </td>
                    <td className="px-6 py-4">
                      {t.participants_count ?? 0}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link 
                          href={`/dashboard/admin/tournaments/${t.id}`}
                          className="p-1.5 text-text-muted hover:text-info bg-surface-muted/50 rounded-md transition-colors"
                          title="View"
                        >
                          <Trophy className="h-4 w-4" />
                        </Link>
                        <button 
                          onClick={() => openEditForm(t)}
                          className="p-1.5 text-text-muted hover:text-info bg-surface-muted/50 rounded-md transition-colors"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => setTournamentToDelete(t.id)}
                          className="p-1.5 text-text-muted hover:text-danger bg-surface-muted/50 rounded-md transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <TournamentFormDialog 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        onSave={handleSave}
        initialData={editingTournament}
      />
      <ConfirmDialog
        isOpen={!!tournamentToDelete}
        onCancel={() => setTournamentToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Tournament"
        description="Are you sure you want to permanently delete this tournament? This action cannot be undone."
        confirmText="Delete Tournament"
        isDestructive={true}
        loading={isDeleting}
      />
    </div>
  )
}
