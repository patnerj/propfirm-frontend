'use client'

import { useEffect } from 'react'

export function LiveChat() {
  useEffect(() => {
    if (document.getElementById('fxsim-livechat')) return
    const s = document.createElement('script')
    s.id = 'fxsim-livechat'
    s.async = true
    s.src = 'https://embed.tawk.to/6a35aa74d0dd3e1d406c7115/1jrgq3mlr'
    s.charset = 'UTF-8'
    s.setAttribute('crossorigin', '*')
    document.body.appendChild(s)
  }, [])
  return null
}
