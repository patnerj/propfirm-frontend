import fs from 'fs'
import path from 'path'

function runDashboardWrappingVerification() {
  console.log('=== EMPIRICAL VERIFICATION: Dashboard Page Section Boundary Wrapping ===\n')

  const pagePath = path.join(__dirname, '../src/app/dashboard/page.tsx')
  const content = fs.readFileSync(pagePath, 'utf-8')

  const expectedTitles = [
    'KYC Verification Status',
    'Start Challenge',
    'Account Summary',
    'Account Overview Metrics',
    'Challenge Progress',
    'Equity Curve',
    'Performance Insights',
    'Trader Badges',
    'Recent Trades',
    'Quick Actions',
    'Your Challenges',
  ]

  let passed = 0
  let failed = 0

  // 1. Verify import of SectionErrorBoundary
  if (content.includes("import { SectionErrorBoundary } from '@/components/ui/section-error-boundary'")) {
    console.log("✓ PASS: SectionErrorBoundary imported in src/app/dashboard/page.tsx")
    passed++
  } else {
    console.error("✗ FAIL: SectionErrorBoundary import missing in page.tsx")
    failed++
  }

  // 2. Count occurrences of <SectionErrorBoundary
  const matches = content.match(/<SectionErrorBoundary/g) || []
  if (matches.length === expectedTitles.length) {
    console.log(`✓ PASS: Found exactly ${matches.length} SectionErrorBoundary blocks in page.tsx (matching all expected sections)`)
    passed++
  } else {
    console.error(`✗ FAIL: Expected ${expectedTitles.length} SectionErrorBoundary blocks, found ${matches.length}`)
    failed++
  }

  // 3. Verify each expected title is present as title="..."
  for (const title of expectedTitles) {
    const titleRegex = new RegExp(`<SectionErrorBoundary[^>]*title=["']${title.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&")}["']`)
    if (titleRegex.test(content)) {
      console.log(`✓ PASS: Verified boundary title="${title}"`)
      passed++
    } else {
      console.error(`✗ FAIL: Missing boundary title="${title}"`)
      failed++
    }
  }

  console.log(`\n=== SUMMARY: ${passed} passed, ${failed} failed ===`)
  if (failed > 0) {
    process.exit(1)
  }
}

runDashboardWrappingVerification()
