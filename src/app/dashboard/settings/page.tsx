'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { useAuth } from '@/store/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/ui/page-header'
import {
  User, Mail, ShieldCheck, Lock, LogOut, AtSign, MailWarning, BadgeCheck,
} from 'lucide-react'

export default function SettingsPage() {
  const router          = useRouter()
  const user            = useAuth((s) => s.user)
  const signout         = useAuth((s) => s.signout)

  const [twoFA, setTwoFA]   = useState<boolean | null>(null)
  const [busy,  setBusy]    = useState(false)
  const [resending, setResending] = useState(false)

  useEffect(() => {
    api.auth.twoFactorStatus().then((res) => {
      if (res.ok) setTwoFA(res.data.enabled)
      else        setTwoFA(false)
    })
  }, [])

  const toggle2FA = async () => {
    if (twoFA == null) return
    setBusy(true)
    const res = await api.auth.twoFactorToggle(!twoFA)
    setBusy(false)
    if (res.ok) { setTwoFA(res.data.enabled); toast.success(res.data.enabled ? '2FA enabled' : '2FA disabled') }
    else        toast.error(res.error)
  }

  const resendVerify = async () => {
    setResending(true)
    const res = await api.auth.resendVerification()
    setResending(false)
    if (res.ok) toast.success('Verification email sent — check your inbox')
    else        toast.error(res.error)
  }

  const handleSignout = async () => {
    await signout()
    toast.success('Signed out')
    router.replace('/')
  }

  if (!user) return null

  return (
    <div className="space-y-8">
      <PageHeader
        variant="hero"
        title="Account Settings"
        description="Manage your account, security, and preferences."
        icon={User}
        badge={{ label: 'Preferences', tone: 'accent' }}
      />

      <div className="grid lg:grid-cols-2 gap-6 w-full">
        {/* Left Column: Profile */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b border-border-subtle">
                <div className="h-14 w-14 rounded-full bg-accent/15 text-accent flex items-center justify-center text-lg font-bold border border-accent/20">
                  {(user.display_name || user.username).slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-text">{user.display_name || user.username}</div>
                  <div className="text-sm text-text-muted">@{user.username}</div>
                </div>
                {user.is_admin && <Badge tone="accent" className="ml-auto">Admin</Badge>}
              </div>

              <ReadOnlyField icon={User}  label="Username" value={user.username} />
              <ReadOnlyField icon={AtSign} label="Display name" value={user.display_name} />
              <div>
                <Label>Email</Label>
                <div className="mt-1.5 flex items-center gap-2 px-3 h-10 rounded-md border border-border-subtle bg-surface-muted/50 text-sm">
                  <Mail className="h-4 w-4 text-text-muted" />
                  <span className="flex-1 truncate text-text">{user.email}</span>
                  {user.email_verified ? (
                    <Badge tone="success"><BadgeCheck className="h-3 w-3 mr-1" /> Verified</Badge>
                  ) : (
                    <Badge tone="warn">Unverified</Badge>
                  )}
                </div>
                {!user.email_verified && (
                  <div className="mt-2 text-xs text-text-muted flex items-center gap-1.5 leading-relaxed">
                    <MailWarning className="h-3.5 w-3.5 text-warn shrink-0" />
                    Verify your email to enable payouts.
                    <button
                      onClick={resendVerify}
                      disabled={resending}
                      className="text-accent hover:underline disabled:opacity-50 ml-1 font-medium"
                    >
                      {resending ? 'Sending…' : 'Resend verification'}
                    </button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Security & Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Security</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-md bg-success/10 text-success flex items-center justify-center shrink-0">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-text">Two-factor authentication</div>
                    <div className="text-xs text-text-muted leading-relaxed">Add a time-based code from your authenticator app on every sign-in.</div>
                  </div>
                </div>
                <div className="shrink-0">
                  {twoFA == null ? (
                    <Skeleton className="h-9 w-24" />
                  ) : (
                    <Button
                      variant={twoFA ? 'outline' : 'primary'}
                      size="sm"
                      loading={busy}
                      onClick={toggle2FA}
                    >
                      {twoFA ? 'Disable' : 'Enable'}
                    </Button>
                  )}
                </div>
              </div>

              <hr className="border-border-subtle" />

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-md bg-accent/10 text-accent flex items-center justify-center shrink-0">
                    <Lock className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-text">Password</div>
                    <div className="text-xs text-text-muted leading-relaxed">Update your password through the password-reset email link.</div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const res = await api.auth.requestReset(user.email)
                    if (res.ok) toast.success('Password reset link sent to your email')
                    else        toast.error(res.error)
                  }}
                >
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-danger/30">
            <CardHeader><CardTitle className="text-danger">Account actions</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-text">Sign out</div>
                  <div className="text-xs text-text-muted">End your session on this device.</div>
                </div>
                <Button variant="outline" onClick={handleSignout} size="sm">
                  <LogOut className="h-4 w-4 mr-1.5" /> Sign out
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function ReadOnlyField({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-1.5 flex items-center gap-2 px-3 h-10 rounded-md border border-border-subtle bg-surface-muted/50 text-sm">
        <Icon className="h-4 w-4 text-text-muted" />
        <span className="truncate text-text font-medium">{value}</span>
      </div>
    </div>
  )
}
