'use client'

import { ShoppingCart, CheckCircle2, XCircle } from 'lucide-react'
import { fmtUSD, toNum } from '@/lib/format'
import type { Account, ChallengeAccount } from '@/types/api'

interface Props {
  accounts: ChallengeAccount[] | null
  account?: Account | null
  challengeStatus?: string | null
}

export function TradingLockState({ accounts, account, challengeStatus }: Props) {
  const passed = challengeStatus === 'passed' || !!accounts?.some((a) => a.status === 'passed')
  const failed = challengeStatus === 'failed' || !!accounts?.some((a) => a.status === 'failed')
  const funded = challengeStatus === 'funded'
  const reason: 'no_challenge' | 'phase_passed' | 'challenge_failed' | 'funded' =
    funded ? 'funded'
    : passed ? 'phase_passed'
    : failed ? 'challenge_failed'
    : (!accounts || accounts.length === 0) && !account ? 'no_challenge'
    : 'challenge_failed'

  const cfg = {
    no_challenge: {
      tone: 'accent' as const, icon: ShoppingCart,
      title: 'No active challenge',
      body: 'You need an active challenge to access the trading terminal. Purchase a challenge to get started.',
      cta: { href: '/challenges', label: 'Purchase Challenge' },
    },
    phase_passed: {
      tone: 'success' as const, icon: CheckCircle2,
      title: 'Phase passed — trading frozen',
      body: 'Congratulations! This phase has been passed and trading is frozen on it. Your next phase will be available shortly — check your dashboard.',
      cta: { href: '/dashboard', label: 'Go to Dashboard' },
    },
    challenge_failed: {
      tone: 'danger' as const, icon: XCircle,
      title: 'Challenge ended — trading frozen',
      body: 'This challenge has ended and trading is frozen. Your final results are shown below. You can start a new challenge whenever you’re ready.',
      cta: { href: '/challenges', label: 'Start a new challenge' },
    },
    funded: {
      tone: 'success' as const, icon: CheckCircle2,
      title: 'Funded account — trading frozen',
      body: 'This account is funded. Trading is currently frozen here; check your dashboard for next steps.',
      cta: { href: '/dashboard', label: 'Go to Dashboard' },
    },
  }[reason]

  const Icon = cfg.icon
  const bg = cfg.tone === 'success' ? 'bg-success-muted text-success'
    : cfg.tone === 'danger' ? 'bg-danger-muted text-danger' : 'bg-accent-muted text-accent'

  const statusLabel = failed ? 'Failed' : passed ? 'Passed' : funded ? 'Funded' : null

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="text-center max-w-md">
        <div className={`inline-flex h-12 w-12 rounded-xl items-center justify-center mb-4 ${bg}`}>
          <Icon className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-semibold tracking-tight">{cfg.title}</h2>
        <p className="text-sm text-text-muted mt-2">{cfg.body}</p>

        {account && (
          <div className="mt-5 grid grid-cols-2 gap-2 text-left">
            {statusLabel && (
              <div className="col-span-2 flex items-center justify-between rounded-md border border-border-subtle px-3 py-2">
                <span className="text-2xs uppercase tracking-wider text-text-muted">Final status</span>
                <span className={`text-sm font-semibold ${failed ? 'text-danger' : 'text-success'}`}>{statusLabel}</span>
              </div>
            )}
            <div className="rounded-md border border-border-subtle px-3 py-2">
              <div className="text-2xs uppercase tracking-wider text-text-muted">Balance</div>
              <div className="text-sm font-semibold tabular">{fmtUSD(toNum(account.balance))}</div>
            </div>
            <div className="rounded-md border border-border-subtle px-3 py-2">
              <div className="text-2xs uppercase tracking-wider text-text-muted">Equity</div>
              <div className="text-sm font-semibold tabular">{fmtUSD(toNum(account.equity))}</div>
            </div>
          </div>
        )}

        <div className="mt-6">
          <a href={cfg.cta.href} className="inline-flex h-10 px-5 items-center rounded-md bg-accent text-white text-sm font-medium hover:bg-accent-hover focus-ring">
            {cfg.cta.label}
          </a>
        </div>
      </div>
    </div>
  )
}
