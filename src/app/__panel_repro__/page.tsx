'use client'

import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels'

// Minimal repro of DesktopLayout's PanelGroup structure from
// src/app/dashboard/trading/page.tsx (lines 236-368), with the exact same
// numeric size props, wrapped in a fixed 1400x700 container so we can read
// back rendered pixel widths deterministically.
export default function PanelRepro() {
  return (
    <div style={{ width: 1400, height: 700, border: '2px solid black' }}>
      <PanelGroup orientation="horizontal" className="flex-1 min-h-0 w-full rounded-lg" style={{ height: '100%' }}>
        <Panel
          defaultSize={24}
          minSize={18}
          maxSize={30}
          collapsible={true}
          collapsedSize={4}
        >
          <div id="mw-panel" style={{ background: 'red', height: '100%' }}>MW</div>
        </Panel>

        <PanelResizeHandle className="w-3 relative group">
          <div />
        </PanelResizeHandle>

        <Panel defaultSize={52} minSize={40}>
          <div id="center-panel" style={{ background: 'green', height: '100%' }}>CENTER</div>
        </Panel>

        <PanelResizeHandle className="w-3 relative group">
          <div />
        </PanelResizeHandle>

        <Panel defaultSize={24} minSize={18} maxSize={30}>
          <div id="ticket-panel" style={{ background: 'blue', height: '100%' }}>TICKET</div>
        </Panel>
      </PanelGroup>
    </div>
  )
}
