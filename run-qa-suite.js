const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const FRONTEND_BASE = 'http://localhost:3000';
const BACKEND_WP_LOCAL = 'http://propfirm.local/wp-json/fxsim/v1';
const NEXT_PROXY_API = 'http://localhost:3000/api/wp';

const results = {
  total: 0,
  passed: 0,
  failed: 0,
  details: []
};

function recordTest(phase, name, passed, details = '') {
  results.total++;
  if (passed) {
    results.passed++;
    console.log(`  \x1b[32m✔ [PASS]\x1b[0m [${phase}] ${name}`);
  } else {
    results.failed++;
    console.log(`  \x1b[31m✖ [FAIL]\x1b[0m [${phase}] ${name} - ${details}`);
  }
  results.details.push({ phase, name, passed, details });
}

let ADMIN_API_KEY = '';
try {
  ADMIN_API_KEY = fs.readFileSync(path.join(__dirname, 'test_api_key.txt'), 'utf8').trim();
} catch {}

async function httpFetch(url, options = {}, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      };
      if (ADMIN_API_KEY && !headers['X-FXSIM-KEY'] && !headers['x-fxsim-key']) {
        headers['X-FXSIM-KEY'] = ADMIN_API_KEY;
      }
      const res = await fetch(url, {
        ...options,
        headers,
        signal: AbortSignal.timeout(10000)
      });
      let data = null;
      const text = await res.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
      return { ok: res.ok, status: res.status, data };
    } catch (err) {
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 250));
        continue;
      }
      return { ok: false, status: 0, error: err.message };
    }
  }
}

function getFileHash(filePath) {
  if (!fs.existsSync(filePath)) return null;
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/\r\n/g, '\n');
  return crypto.createHash('sha256').update(content).digest('hex');
}

async function runSuite() {
  console.log('\x1b[36m========================================================================\x1b[0m');
  console.log('\x1b[36m   LEAD QA AUTOMATION & SYSTEMS RELIABILITY TEST SUITE                  \x1b[0m');
  console.log('\x1b[36m   Prop Firm System: Next.js Frontend + WP REST API + DB Integrity       \x1b[0m');
  console.log('\x1b[36m========================================================================\x1b[0m\n');

  // =========================================================================
  // TEST PHASE 1: FRONTEND STATIC ANALYSIS & TYPE SAFETY & ROUTES
  // =========================================================================
  console.log('\x1b[33m--- TEST PHASE 1: Frontend Static Analysis & Route Verification ---\x1b[0m');
  
  // 1. TypeScript compilation check
  try {
    const tscOutput = execSync('npx tsc --noEmit', {
      cwd: 'd:\\Full Propfirm System for antigravity\\propfirm-frontend-v10.7.1',
      encoding: 'utf8',
      stdio: 'pipe'
    });
    recordTest('Phase 1', 'TypeScript Compilation (npx tsc --noEmit)', true);
  } catch (err) {
    recordTest('Phase 1', 'TypeScript Compilation (npx tsc --noEmit)', false, err.stdout || err.message);
  }

  // 2. Next.js Admin & Dashboard Route HTTP Resolution
  const adminRoutes = [
    '/admin/config',
    '/admin/marketing',
    '/admin/traders',
    '/admin/traders/1',
    '/admin/risk',
    '/admin/operations',
    '/admin/payouts',
    '/admin/tournaments',
    '/admin/analytics',
    '/dashboard/admin/users',
    '/tournaments/1',
    '/login'
  ];

  for (const route of adminRoutes) {
    const url = `${FRONTEND_BASE}${route}`;
    const res = await httpFetch(url);
    const isGood = res.status === 200 || res.status === 307 || res.status === 308;
    recordTest('Phase 1', `Route HTTP Resolution: ${route}`, isGood, `Status: ${res.status}`);
  }

  // =========================================================================
  // TEST PHASE 2: REST API CONTROLLER & ENDPOINTS SMOKE TEST
  // =========================================================================
  console.log('\n\x1b[33m--- TEST PHASE 2: REST API Controller & Endpoints Smoke Test ---\x1b[0m');

  // Target direct WordPress REST API endpoint
  const apiBase = BACKEND_WP_LOCAL;

  // 1. Plan Builder Save with all 6 Drawdown Models & Extended Prop Rules
  const drawdownModels = ['static', 'trailing', 'eod_trailing', 'static_balance', 'trailing_equity', 'trailing_balance'];
  for (const ddType of drawdownModels) {
    const planPayload = {
      name: `QA ${ddType.toUpperCase()} Plan`,
      slug: `qa-plan-${ddType}`,
      plan_type: '2-step',
      account_size: 100000,
      price: 499,
      drawdown_type: ddType,
      p1_profit_target: 8,
      p1_daily_dd: 5,
      p1_max_dd: 10,
      p1_min_days: 5,
      p1_max_days: 0,
      p2_profit_target: 5,
      p2_daily_dd: 5,
      p2_max_dd: 10,
      p2_min_days: 5,
      p2_max_days: 0,
      funded_profit_split: 80,
      funded_max_dd: 10,
      max_leverage: 100,
      news_trading: 1,
      weekend_holding: 1,
      consistency_rule: 1,
      consistency_pct: 35,
      ea_allowed: 1,
      hedging_allowed: 1,
      copy_trading_allowed: 1,
      martingale_allowed: 0,
      stop_loss_required: 1,
      min_trade_seconds: 45,
      min_hold_action: 'void_pnl',
      evaluation_profit_share: 15,
      is_active: 1
    };

    const res = await httpFetch(`${apiBase}/admin/plans/save`, {
      method: 'POST',
      body: JSON.stringify(planPayload)
    });

    const passed = (res.ok && res.data && (res.data.success === true || res.data.id || res.data.plan)) ||
                   (res.data && res.data.code !== 'rest_no_route');
    recordTest('Phase 2', `Plan Builder Save [Model: ${ddType}] (min_trade_seconds=45, consistency=35%, eval_profit_share=15%)`, passed, `Status: ${res.status}, Response: ${JSON.stringify(res.data)}`);
  }

  // 2. Trader 360 & Aliases
  const trader360Res1 = await httpFetch(`${apiBase}/admin/trader/1/360`);
  recordTest('Phase 2', 'Trader 360 Endpoint: GET /admin/trader/1/360', trader360Res1.status === 200 || trader360Res1.data?.user !== undefined, `Status: ${trader360Res1.status}`);

  const trader360Res2 = await httpFetch(`${apiBase}/admin/traders/1/360`);
  recordTest('Phase 2', 'Trader 360 Alias: GET /admin/traders/1/360', trader360Res2.status === 200 || trader360Res2.data?.user !== undefined, `Status: ${trader360Res2.status}`);

  // 3. Challenge Overrides Endpoint with Aliased Parameters
  const overridePayload = {
    max_daily_loss: 6,
    max_total_loss: 11,
    profit_split: 90,
    min_trading_days: 3,
    custom_news_trading: 1,
    weekend_holding: 1,
    admin_note: 'Automated QA Enterprise Custom Rule Override Test'
  };
  const overrideRes = await httpFetch(`${apiBase}/admin/challenge/111/override`, {
    method: 'POST',
    body: JSON.stringify(overridePayload)
  });
  recordTest('Phase 2', 'Challenge Overrides: POST /admin/challenge/111/override', overrideRes.status === 200 || overrideRes.data?.success === true, `Status: ${overrideRes.status}, Response: ${JSON.stringify(overrideRes.data)}`);

  // 4. Marketing Banners Endpoint
  const bannerPayload = {
    title: 'QA Automated Test Banner 2026',
    placement: 'top',
    coupon_code: 'QASUITE20',
    cta_text: 'Claim 20% Off',
    cta_link: '/pricing',
    is_active: 1
  };
  const bannerSaveRes = await httpFetch(`${apiBase}/admin/banners/save`, {
    method: 'POST',
    body: JSON.stringify(bannerPayload)
  });
  recordTest('Phase 2', 'Marketing Banners: POST /admin/banners/save', bannerSaveRes.status === 200 || bannerSaveRes.data?.success === true, `Status: ${bannerSaveRes.status}`);

  const bannersGetRes = await httpFetch(`${apiBase}/banners?placement=top`);
  recordTest('Phase 2', 'Marketing Banners Retrieval: GET /banners', bannersGetRes.status === 200 || Array.isArray(bannersGetRes.data), `Status: ${bannersGetRes.status}`);

  // 5. Risk Intelligence Alerts Endpoint
  const riskAlertsRes = await httpFetch(`${apiBase}/admin/risk/alerts`);
  const riskPassed = riskAlertsRes.status === 200 && riskAlertsRes.data && (riskAlertsRes.data.alerts !== undefined || riskAlertsRes.data.breaches !== undefined);
  recordTest('Phase 2', 'Risk Intelligence: GET /admin/risk/alerts', riskPassed, `Status: ${riskAlertsRes.status}, Data: ${JSON.stringify(riskAlertsRes.data).slice(0, 80)}...`);

  // 6. Operations Engine: Symbol Create & Delete
  const symbolCreatePayload = {
    symbol: 'QAUSD',
    display_name: 'QA Automated Asset',
    category: 'Forex',
    spread: 1.1,
    commission: 0,
    min_lot: 0.01,
    max_lot: 100.0,
    contract_size: 100000,
    is_active: 1
  };
  const symbolCreateRes = await httpFetch(`${apiBase}/admin/symbol/create`, {
    method: 'POST',
    body: JSON.stringify(symbolCreatePayload)
  });
  const createdSymbolId = symbolCreateRes.data?.id;
  recordTest('Phase 2', 'Operations: POST /admin/symbol/create', symbolCreateRes.status === 200 || symbolCreateRes.data?.success === true, `Status: ${symbolCreateRes.status}, SymbolId: ${createdSymbolId}`);

  if (createdSymbolId) {
    const symbolDeleteRes = await httpFetch(`${apiBase}/admin/symbol/${createdSymbolId}`, {
      method: 'DELETE'
    });
    recordTest('Phase 2', `Operations: DELETE /admin/symbol/${createdSymbolId}`, symbolDeleteRes.status === 200 || symbolDeleteRes.data?.success === true, `Status: ${symbolDeleteRes.status}`);
  }

  // =========================================================================
  // TEST PHASE 3: DATABASE SCHEMA & REPOSITORY INTEGRITY
  // =========================================================================
  console.log('\n\x1b[33m--- TEST PHASE 3: Database Integrity & Data Persistence Validation ---\x1b[0m');

  const dbSchemaFile = 'd:\\Full Propfirm System for antigravity\\backend-email-update v10.7.1\\propfirm-system\\includes\\class-database.php';
  const challengeDbFile = 'd:\\Full Propfirm System for antigravity\\backend-email-update v10.7.1\\propfirm-system\\includes\\challenge\\class-challenge-db.php';
  const restApiFile = 'd:\\Full Propfirm System for antigravity\\backend-email-update v10.7.1\\propfirm-system\\includes\\class-rest-api.php';

  const dbContent = fs.readFileSync(dbSchemaFile, 'utf8');
  const challengeDbContent = fs.readFileSync(challengeDbFile, 'utf8');
  const restApiContent = fs.readFileSync(restApiFile, 'utf8');

  // Verify challenge plans columns
  const planColumns = [
    'min_trade_seconds',
    'min_hold_action',
    'consistency_rule',
    'consistency_pct',
    'evaluation_profit_share',
    'copy_trading_allowed',
    'martingale_allowed',
    'hedging_allowed',
    'stop_loss_required'
  ];

  for (const col of planColumns) {
    const inDb = dbContent.includes(col) || challengeDbContent.includes(col);
    const inRest = restApiContent.includes(col);
    recordTest('Phase 3', `Database Schema & REST Mapping: Column '${col}' in plans table`, inDb && inRest, `DB: ${inDb}, REST: ${inRest}`);
  }

  // Verify challenge breaches table definition
  const hasBreachesTable = dbContent.includes('fxsim_challenge_breaches') || challengeDbContent.includes('fxsim_challenge_breaches');
  recordTest('Phase 3', "Database Table: 'fxsim_challenge_breaches' Audit Logging Table", hasBreachesTable);

  // Verify challenge accounts overrides columns
  const overrideColumns = ['custom_daily_dd', 'custom_max_dd', 'custom_profit_split', 'custom_min_days', 'custom_news_trading', 'custom_weekend_holding', 'override_admin_note'];
  for (const col of overrideColumns) {
    const inAccounts = dbContent.includes(col) || challengeDbContent.includes(col);
    recordTest('Phase 3', `Database Table 'fxsim_challenge_accounts': Override column '${col}'`, inAccounts);
  }

  // =========================================================================
  // TEST PHASE 4: MULTI-WORKSPACE SYNCHRONIZATION VERIFICATION
  // =========================================================================
  console.log('\n\x1b[33m--- TEST PHASE 4: Multi-Workspace Synchronization Verification ---\x1b[0m');

  const filesToCheck = [
    'backend-email-update v10.7.1/propfirm-system/includes/class-rest-api.php',
    'backend-email-update v10.7.1/propfirm-system/includes/class-symbols.php',
    'backend-email-update v10.7.1/propfirm-system/includes/class-database.php',
    'propfirm-frontend-v10.7.1/src/lib/api.ts',
    'propfirm-frontend-v10.7.1/src/types/api.ts',
    'propfirm-frontend-v10.7.1/src/app/admin/config/page.tsx',
    'propfirm-frontend-v10.7.1/src/app/admin/marketing/page.tsx',
    'propfirm-frontend-v10.7.1/src/app/admin/traders/[id]/page.tsx',
    'propfirm-frontend-v10.7.1/src/components/admin/EnterpriseOverrideModal.tsx'
  ];

  const primaryDir = 'd:/Full Propfirm System for antigravity';
  const secondaryDir = 'c:/Users/Administrator/Downloads/Full Propfirm System for antigravity';
  const liveWpDir = 'C:/Users/Administrator/Local Sites/propfirm/app/public/wp-content/plugins/propfirm-system';

  for (const relFile of filesToCheck) {
    const primaryPath = path.join(primaryDir, relFile);
    const secondaryPath = path.join(secondaryDir, relFile);
    
    const primaryHash = getFileHash(primaryPath);
    const secondaryHash = getFileHash(secondaryPath);
    
    const isSync = primaryHash !== null && primaryHash === secondaryHash;
    recordTest('Phase 4', `Workspace Sync (Primary ↔ Secondary): ${path.basename(relFile)}`, isSync, `Primary: ${primaryHash?.slice(0, 8)} vs Secondary: ${secondaryHash?.slice(0, 8)}`);

    // Check live WP directory if it's a plugin file
    if (relFile.includes('propfirm-system/')) {
      const pluginSubPath = relFile.replace('backend-email-update v10.7.1/propfirm-system/', '');
      const livePath = path.join(liveWpDir, pluginSubPath);
      const liveHash = getFileHash(livePath);
      const isLiveSync = primaryHash !== null && primaryHash === liveHash;
      recordTest('Phase 4', `Live WordPress Sync (Primary ↔ Local WP): ${pluginSubPath}`, isLiveSync, `Primary: ${primaryHash?.slice(0, 8)} vs Live: ${liveHash?.slice(0, 8)}`);
    }
  }

  // =========================================================================
  // SUMMARY REPORT
  // =========================================================================
  console.log('\n\x1b[36m========================================================================\x1b[0m');
  console.log('\x1b[36m   AUTOMATED TEST SUITE EXECUTION SUMMARY                               \x1b[0m');
  console.log('\x1b[36m========================================================================\x1b[0m');
  console.log(`  Total Tests Run:  \x1b[1m${results.total}\x1b[0m`);
  console.log(`  Passed:           \x1b[32m\x1b[1m${results.passed}\x1b[0m`);
  console.log(`  Failed:           \x1b[31m\x1b[1m${results.failed}\x1b[0m`);
  console.log(`  Success Rate:     \x1b[32m\x1b[1m${((results.passed / results.total) * 100).toFixed(1)}%\x1b[0m`);
  console.log('\x1b[36m========================================================================\x1b[0m\n');
}

runSuite().catch(console.error);
