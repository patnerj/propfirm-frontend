'use client'

import { useEffect } from 'react'

export function LiveChat() {
  useEffect(() => {
    if (document.getElementById('fxsim-livechat')) return
    var s1 = document.createElement('script')
    var s0 = document.getElementsByTagName('script')[0]
    s1.id = 'fxsim-livechat'
    s1.async = true
    s1.src = 'https://embed.tawk.to/6a35aa74d0dd3e1d406c7115/1jrgq3mlr'
    s1.charset = 'UTF-8'
    s1.setAttribute('crossorigin', '*')
    s0.parentNode!.insertBefore(s1, s0)
  }, [])
  return null
}
