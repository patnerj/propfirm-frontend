'use client'

import { useEffect, useState } from 'react'
import { Toaster } from 'sonner'
import { useAuth } from '@/store/auth'
import { useImpersonation } from '@/store/impersonation'
import { ThemeProvider } from '@/components/theme-provider'
import { ThemeLoader } from '@/components/theme-loader'
import { ThemeContextProvider } from '@/context/ThemeContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { onSessionCleared } from '@/lib/session'

export function Providers({ children }: { children: React.ReactNode }) {
  const bootstrap = useAuth((s) => s.bootstrap)
  const hydrateImpersonation = useImpersonation((s) => s.hydrate)
  
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,   // 5 minutes fresh time
        gcTime: 30 * 60 * 1000,      // 30 minutes garbage collection time
        refetchOnMount: false,       // Prefer cached data on route navigation
        refetchOnWindowFocus: false, // Prevent unsolicited refetches on window focus
        retry: 1,
      },
    },
  }))

  useEffect(() => {
    bootstrap()
    hydrateImpersonation()
    // Wipe the react-query cache on logout — otherwise the next login on a
    // shared computer can briefly see the previous user's cached data.
    return onSessionCleared(() => queryClient.clear())
  }, [bootstrap, hydrateImpersonation, queryClient])

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeContextProvider>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <ThemeLoader />
          {children}
          <Toaster
            position="top-right"
            theme="dark"
            closeButton
            richColors={false}
            duration={4000}
          />
        </ThemeProvider>
      </ThemeContextProvider>
    </QueryClientProvider>
  )
}
