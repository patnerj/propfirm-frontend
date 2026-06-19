'use client'

import { useEffect } from 'react'

declare global {
  interface Window {
    Tawk_API: object
    Tawk_LoadStart: Date
  }
}

export function LiveChat() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (document.getElementById('fxsim-livechat')) return

    window.Tawk_API = window.Tawk_API || {}
    window.Tawk_LoadStart = new Date()

    const s1 = document.createElement('script')
    const s0 = document.getElementsByTagName('script')[0]
    s1.id = 'fxsim-livechat'
    s1.async = true
    s1.src = 'https://embed.tawk.to/6a35aa74d0dd3e1d406c7115/1jrgq3mlr'
    s1.charset = 'UTF-8'
    s1.setAttribute('crossorigin', '*')
    s0.parentNode!.insertBefore(s1, s0)
  }, [])

  return null
}
