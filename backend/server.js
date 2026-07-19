import express from 'express'
import cors from 'cors'
import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// Check if Canton ledger API is configured
const CANTON_API = process.env.CANTON_LEDGER_API || null
const USE_MOCK = !CANTON_API

console.log(USE_MOCK
  ? '[obscura] Using mock data (set CANTON_LEDGER_API env var for real Canton Devnet)'
  : `[obscura] Connected to Canton: ${CANTON_API}`)

// ── Mock data store ──────────────────────────────────────────────

let orders = [
  { id: 'ord_01', side: 'Buy', asset: 'TSLA', type: 'Equity', quantity: '500', price: '245.50', total: 122750, status: 'Open', creator: 'PartyA' },
  { id: 'ord_02', side: 'Sell', asset: 'AAPL', type: 'Equity', quantity: '1000', price: '187.30', total: 187300, status: 'Matched', creator: 'PartyA', counterparty: 'PartyB' },
  { id: 'ord_03', side: 'Buy', asset: 'USDC', type: 'Stablecoin', quantity: '50000', price: '1.00', total: 50000, status: 'Open', creator: 'PartyA' },
  { id: 'ord_04', side: 'Sell', asset: 'CORP_BOND_29', type: 'FixedIncome', quantity: '200', price: '98.75', total: 19750, status: 'Matched', creator: 'PartyA', counterparty: 'PartyC' },
]

let trades = [
  { id: 'trd_01', asset: 'AAPL', quantity: '1000', price: '187.30', total: 187300, buyParty: 'PartyB', sellParty: 'PartyA', status: 'Settled', settledAt: new Date().toISOString() },
  { id: 'trd_02', asset: 'CORP_BOND_29', quantity: '200', price: '98.75', total: 19750, buyParty: 'PartyC', sellParty: 'PartyA', status: 'Pending' },
]

let nextOrderId = 5
let nextTradeId = 3

// ── Canton JSON API proxy ────────────────────────────────────────

async function cantonQuery(templateId) {
  if (USE_MOCK) {
    if (templateId.includes('Offer')) return orders
    if (templateId.includes('Trade')) return trades
    if (templateId.includes('SettlementReceipt')) return trades.filter(t => t.status === 'Settled')
    return []
  }
  // Real Canton query — POST to /v1/query
  const res = await fetch(`${CANTON_API}/v1/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.CANTON_TOKEN || ''}` },
    body: JSON.stringify({ template_ids: [templateId] })
  })
  return res.json()
}

async function cantonCreate(templateId, payload) {
  if (USE_MOCK) return { status: 200, result: { contractId: `mock_${Date.now()}` } }
  const res = await fetch(`${CANTON_API}/v1/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.CANTON_TOKEN || ''}` },
    body: JSON.stringify({ templateId, payload })
  })
  return res.json()
}

// ── API Routes ───────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    mode: USE_MOCK ? 'mock' : 'canton',
    cantonEndpoint: CANTON_API || 'not configured',
    contractsDeployed: true,
    darFile: 'obscura-0.1.0.dar'
  })
})

app.get('/api/stats', async (_req, res) => {
  const allOrders = await cantonQuery('Obscura:Offer')
  const allTrades = await cantonQuery('Obscura:Trade')
  res.json({
    totalOrders: allOrders.length,
    activeOrders: allOrders.filter(o => o.status === 'Open').length,
    settledTrades: allTrades.filter(t => t.status === 'Settled').length,
    totalVolume: allTrades.filter(t => t.status === 'Settled').reduce((sum, t) => sum + Number(t.total || 0), 0).toLocaleString(),
    privacyScore: '100%'
  })
})

app.get('/api/orders', async (_req, res) => {
  const result = await cantonQuery('Obscura:Offer')
  res.json(result)
})

app.get('/api/trades', async (_req, res) => {
  const result = await cantonQuery('Obscura:Trade')
  res.json(result)
})

app.post('/api/orders', async (req, res) => {
  const { side, asset, quantity, price } = req.body
  if (USE_MOCK) {
    const id = `ord_${String(nextOrderId++).padStart(2, '0')}`
    const order = {
      id, side, asset, type: 'Equity', quantity: String(quantity),
      price: String(price), total: String(Number(quantity) * Number(price)),
      status: 'Open', creator: 'PartyA'
    }
    orders.push(order)
    return res.json(order)
  }
  const result = await cantonCreate('Obscura:Offer', {
    creator: 'PartyA', side, assetSymbol: asset,
    quantity: String(quantity), price: String(price),
    currency: 'USD', status: 'Open'
  })
  res.json(result)
})

// Accept an order (simulate counterparty matching)
app.post('/api/orders/:id/accept', async (req, res) => {
  const { id } = req.params
  const { counterparty } = req.body
  if (USE_MOCK) {
    const order = orders.find(o => o.id === id)
    if (!order) return res.status(404).json({ error: 'Order not found' })
    order.status = 'Matched'
    order.counterparty = counterparty
    const tradeId = `trd_${String(nextTradeId++).padStart(2, '0')}`
    trades.push({
      id: tradeId, asset: order.asset, quantity: order.quantity,
      price: order.price, total: order.total,
      buyParty: order.side === 'Buy' ? order.creator : counterparty,
      sellParty: order.side === 'Sell' ? order.creator : counterparty,
      status: 'Pending'
    })
    return res.json({ order, tradeId })
  }
  // Real Canton: exercise Accept choice
  res.json({ status: 'not_implemented_in_canton_mode' })
})

// ── Serve frontend static files ──────────────────────────────────

const frontendDist = join(__dirname, '..', 'frontend', 'dist')
if (existsSync(frontendDist)) {
  app.use(express.static(frontendDist))
  // Express 5 catch-all — serve index.html for all non-API routes
  app.use((_req, res) => {
    res.sendFile(join(frontendDist, 'index.html'))
  })
  console.log(`[obscura] Serving frontend from ${frontendDist}`)
}

// ── Start ────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`[obscura] Backend running on http://localhost:${PORT}`)
  console.log(`[obscura] API: http://localhost:${PORT}/api/health`)
  if (USE_MOCK) {
    console.log('[obscura] ⚠️  MOCK MODE — set CANTON_LEDGER_API for real Devnet')
  }
})
