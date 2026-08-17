import React from 'react'
import ReactDOMServer from 'react-dom/server'
import { SectionErrorBoundary } from '../src/components/ui/section-error-boundary'

// Helper component that throws on render
function FaultyComponent({ message }: { message: string }) {
  throw new Error(message)
}

// Helper component that renders normally
function GoodComponent({ label }: { label: string }) {
  return <div className="good-component">{label}</div>
}

function runEmpiricalTests() {
  console.log('=== EMPIRICAL TEST SUITE: Milestone M1 Section Error Boundary ===\n')

  let passed = 0
  let failed = 0

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✓ PASS: ${testName}`)
      passed++
    } else {
      console.error(`✗ FAIL: ${testName}${detail ? ` - ${detail}` : ''}`)
      failed++
    }
  }

  // -------------------------------------------------------------
  // Test 1: Normal Rendering (hasError: false)
  // -------------------------------------------------------------
  try {
    const html = ReactDOMServer.renderToString(
      <SectionErrorBoundary title="Test Section">
        <GoodComponent label="Healthy Widget Content" />
      </SectionErrorBoundary>
    )
    assert(
      html.includes('Healthy Widget Content') && !html.includes('Unable to load section'),
      'Test 1: Normal children render without triggering error boundary',
      `Got output: ${html}`
    )
  } catch (e) {
    assert(false, 'Test 1: Normal children render without triggering error boundary', String(e))
  }

  // -------------------------------------------------------------
  // Test 2: React Error Boundary Static Method getDerivedStateFromError
  // -------------------------------------------------------------
  try {
    const testError = new Error('Simulated Chart Render Failure')
    const derivedState = SectionErrorBoundary.getDerivedStateFromError(testError)
    assert(
      derivedState.hasError === true && derivedState.error === testError,
      'Test 2: getDerivedStateFromError correctly captures error and sets hasError: true'
    )
  } catch (e) {
    assert(false, 'Test 2: getDerivedStateFromError state transition', String(e))
  }

  // -------------------------------------------------------------
  // Test 3: Fallback UI Rendering when hasError is true (Default Fallback)
  // -------------------------------------------------------------
  try {
    const boundary = new SectionErrorBoundary({
      title: 'Equity Curve',
      children: <GoodComponent label="Chart" />,
    })
    
    // Simulate error state in boundary
    boundary.state = {
      hasError: true,
      error: new Error('Cannot read properties of null (reading equity_chart)'),
    }

    const renderedFallback = boundary.render()
    const html = ReactDOMServer.renderToString(renderedFallback as React.ReactElement)

    assert(
      html.includes('Equity Curve') &&
      html.includes('Cannot read properties of null (reading equity_chart)') &&
      html.includes('Retry'),
      'Test 3: Default Fallback Card renders with title, error message, and Retry button when hasError: true',
      `Got output: ${html}`
    )
  } catch (e) {
    assert(false, 'Test 3: Fallback UI Rendering', String(e))
  }

  // -------------------------------------------------------------
  // Test 4: Custom Fallback UI Rendering when fallback prop provided
  // -------------------------------------------------------------
  try {
    const customFallbackNode = <div className="custom-err">Custom Error State</div>
    const boundary = new SectionErrorBoundary({
      title: 'Custom Section',
      fallback: customFallbackNode,
      children: <GoodComponent label="Widget" />,
    })

    boundary.state = {
      hasError: true,
      error: new Error('Some error'),
    }

    const renderedFallback = boundary.render()
    const html = ReactDOMServer.renderToString(renderedFallback as React.ReactElement)

    assert(
      html.includes('Custom Error State') && !html.includes('Retry'),
      'Test 4: Custom fallback ReactNode renders instead of default Card when fallback prop is provided',
      `Got output: ${html}`
    )
  } catch (e) {
    assert(false, 'Test 4: Custom Fallback UI Rendering', String(e))
  }

  // -------------------------------------------------------------
  // Test 5: handleReset state reset & onReset callback execution
  // -------------------------------------------------------------
  try {
    let onResetInvoked = false
    let stateUpdated: any = null

    const boundary = new SectionErrorBoundary({
      title: 'Reset Test',
      onReset: () => {
        onResetInvoked = true
      },
      children: <GoodComponent label="Widget" />,
    })

    boundary.state = {
      hasError: true,
      error: new Error('Transient error'),
    }

    // Mock setState to capture the update
    boundary.setState = function (updater: any) {
      stateUpdated = typeof updater === 'function' ? updater(this.state, this.props) : updater
      this.state = { ...this.state, ...stateUpdated }
    }

    // Invoke handleReset (private method)
    boundary['handleReset']()

    assert(onResetInvoked, 'Test 5a: handleReset executes onReset callback prop')
    assert(
      stateUpdated !== null && stateUpdated.hasError === false && stateUpdated.error === null,
      'Test 5b: handleReset resets state to { hasError: false, error: null }'
    )
    assert(
      boundary.state.hasError === false && boundary.state.error === null,
      'Test 5c: boundary state is successfully reset after retry'
    )
  } catch (e) {
    assert(false, 'Test 5: handleReset state reset & onReset callback execution', String(e))
  }

  // -------------------------------------------------------------
  // Test 6: Faulty onReset callback exception tolerance
  // -------------------------------------------------------------
  try {
    let stateUpdated: any = null

    const boundary = new SectionErrorBoundary({
      title: 'Faulty Reset Test',
      onReset: () => {
        throw new Error('Exception inside user onReset handler')
      },
      children: <GoodComponent label="Widget" />,
    })

    boundary.state = {
      hasError: true,
      error: new Error('Original error'),
    }

    boundary.setState = function (updater: any) {
      stateUpdated = typeof updater === 'function' ? updater(this.state, this.props) : updater
      this.state = { ...this.state, ...stateUpdated }
    }

    // Suppress console.error during expected failure test
    const origError = console.error
    console.error = () => {}

    boundary['handleReset']()

    console.error = origError

    assert(
      stateUpdated !== null && stateUpdated.hasError === false && boundary.state.hasError === false,
      'Test 6: Exception in onReset handler is trapped safely; state is still reset'
    )
  } catch (e) {
    assert(false, 'Test 6: Faulty onReset callback exception tolerance', String(e))
  }

  // -------------------------------------------------------------
  // Test 7: Sibling Section Isolation (Simulated Page Layout)
  // -------------------------------------------------------------
  try {
    // Section A: Healthy
    const boundaryA = new SectionErrorBoundary({ title: 'Section A (KYC)', children: <GoodComponent label="KYC OK" /> })
    boundaryA.state = { hasError: false, error: null }

    // Section B: Errored
    const boundaryB = new SectionErrorBoundary({ title: 'Section B (Equity Chart)', children: <GoodComponent label="Chart" /> })
    boundaryB.state = { hasError: true, error: new Error('Chart Render Failed') }

    // Section C: Healthy
    const boundaryC = new SectionErrorBoundary({ title: 'Section C (Recent Trades)', children: <GoodComponent label="Trades Table OK" /> })
    boundaryC.state = { hasError: false, error: null }

    const pageLayout = (
      <div className="grid">
        {boundaryA.render()}
        {boundaryB.render()}
        {boundaryC.render()}
      </div>
    )

    const html = ReactDOMServer.renderToString(pageLayout as React.ReactElement)

    assert(
      html.includes('KYC OK') &&
      html.includes('Section B (Equity Chart)') &&
      html.includes('Chart Render Failed') &&
      html.includes('Trades Table OK'),
      'Test 7: Sibling sections (A & C) remain fully rendered while Section B shows isolated fallback Card',
      `Got output: ${html}`
    )
  } catch (e) {
    assert(false, 'Test 7: Sibling Section Isolation', String(e))
  }

  console.log(`\n=== SUMMARY: ${passed} passed, ${failed} failed ===`)
  if (failed > 0) {
    process.exit(1)
  }
}

runEmpiricalTests()
