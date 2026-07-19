import { useState } from 'react'
import { ArrowLeft, Plus, Check, X, Lock, EyeOff, Zap, ShieldCheck } from 'lucide-react'

interface Order {
  id: string
  side: 'Buy' | 'Sell'
  asset: string
  type: string
  quantity: string
  price: string
  total: string
  status: 'Open' | 'Matched' | 'Cancelled'
  counterparty?: string
}

interface Trade {
  id: string
  asset: string
  quantity: string
  price: string
  total: string
  buyParty: string
  sellParty: string
  status: 'Pending' | 'Settled' | 'Disputed'
  settledAt?: string
}

// Mock data — in production this comes from Canton ledger
const MOCK_ORDERS: Order[] = [
  { id: 'ord_01', side: 'Buy', asset: 'TSLA', type: 'Equity', quantity: '500', price: '245.50', total: '122,750', status: 'Open' },
  { id: 'ord_02', side: 'Sell', asset: 'AAPL', type: 'Equity', quantity: '1,000', price: '187.30', total: '187,300', status: 'Matched', counterparty: 'Goldman Sachs' },
  { id: 'ord_03', side: 'Buy', asset: 'USDC', type: 'Stablecoin', quantity: '50,000', price: '1.00', total: '50,000', status: 'Open' },
  { id: 'ord_04', side: 'Sell', asset: 'CORP_BOND_29', type: 'FixedIncome', quantity: '200', price: '98.75', total: '19,750', status: 'Matched', counterparty: 'JP Morgan' },
]

const MOCK_TRADES: Trade[] = [
  { id: 'trd_01', asset: 'AAPL', quantity: '1,000', price: '187.30', total: '187,300', buyParty: 'Goldman Sachs', sellParty: 'You', status: 'Settled', settledAt: '2026-07-19T10:15:00Z' },
  { id: 'trd_02', asset: 'CORP_BOND_29', quantity: '200', price: '98.75', total: '19,750', buyParty: 'JP Morgan', sellParty: 'You', status: 'Pending' },
]

const STATS = {
  totalOrders: 4,
  activeOrders: 2,
  settledTrades: 1,
  totalVolume: '207,050',
  privacyScore: '100%',
}

export function Dashboard() {
  const [showCreate, setShowCreate] = useState(false)
  const [selectedTab, setSelectedTab] = useState<'orders' | 'trades'>('orders')
  const [newOrder, setNewOrder] = useState({ side: 'Buy', asset: '', quantity: '', price: '' })

  const handleCreate = () => {
    // In production: submit to Canton via Daml ledger API
    setShowCreate(false)
    setNewOrder({ side: 'Buy', asset: '', quantity: '', price: '' })
  }

  return (
    <main className="of-dashboard">
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <div className="of-dashboard-header">
          <div>
            <p className="of-kicker" style={{ marginBottom: 4 }}>
              <span>Canton Devnet</span> Private Exchange
            </p>
            <h2 style={{ fontFamily: '"Space Grotesk", sans-serif', fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 900, margin: 0 }}>
              OBSCURA
            </h2>
            <p style={{ color: 'var(--of-muted)', margin: '8px 0 0', fontSize: '0.95rem' }}>
              All orders and trades are private. Only you and your counterparty can see them.
            </p>
          </div>
          <button className="of-btn of-btn-dark" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> New Order
          </button>
        </div>

        {/* Stats */}
        <div className="of-cards">
          <div className="of-card">
            <h3>Active Orders</h3>
            <p className="of-value">{STATS.activeOrders}</p>
            <p className="of-sub">of {STATS.totalOrders} total</p>
          </div>
          <div className="of-card">
            <h3>Settled Trades</h3>
            <p className="of-value">{STATS.settledTrades}</p>
            <p className="of-sub">${STATS.totalVolume} volume</p>
          </div>
          <div className="of-card">
            <h3>Privacy</h3>
            <p className="of-value">{STATS.privacyScore}</p>
            <p className="of-sub">orders invisible to third parties</p>
          </div>
        </div>

        {/* Create Order Modal */}
        {showCreate && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgb(0 0 0 / 0.6)', display: 'flex',
            alignItems: 'center', justifyContent: 'center'
          }} onClick={() => setShowCreate(false)}>
            <div style={{
              background: 'var(--of-paper)', border: 'var(--of-line)',
              padding: 40, maxWidth: 480, width: '100%', margin: 20
            }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h3 style={{ fontFamily: '"Space Grotesk", sans-serif', fontSize: '1.5rem', fontWeight: 900, margin: 0 }}>New Private Order</h3>
                <button onClick={() => setShowCreate(false)}><X size={20} /></button>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.8rem', fontWeight: 800, display: 'block', marginBottom: 6 }}>Side</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['Buy', 'Sell'].map(s => (
                    <button key={s}
                      onClick={() => setNewOrder(o => ({ ...o, side: s }))}
                      style={{
                        flex: 1, padding: '10px 20px', border: 'var(--of-line)',
                        fontFamily: '"JetBrains Mono", monospace', fontSize: '0.85rem', fontWeight: 800,
                        background: newOrder.side === s ? (s === 'Buy' ? 'var(--of-mint)' : 'var(--of-orange)') : 'transparent',
                        color: newOrder.side === s ? 'var(--of-ink)' : 'var(--of-ink)',
                      }}
                    >{s}</button>
                  ))}
                </div>
              </div>

              {[
                ['Asset Symbol', 'asset'],
                ['Quantity', 'quantity'],
                ['Price (USD)', 'price'],
              ].map(([label, field]) => (
                <div key={field} style={{ marginBottom: 16 }}>
                  <label style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.8rem', fontWeight: 800, display: 'block', marginBottom: 6 }}>{label}</label>
                  <input
                    type="text"
                    value={newOrder[field as keyof typeof newOrder]}
                    onChange={e => setNewOrder(o => ({ ...o, [field]: e.target.value }))}
                    style={{
                      width: '100%', padding: '12px 14px', border: 'var(--of-line)',
                      fontFamily: '"JetBrains Mono", monospace', fontSize: '0.9rem',
                      background: 'var(--of-paper)',
                    }}
                    placeholder={field === 'asset' ? 'e.g. TSLA' : field === 'quantity' ? 'e.g. 500' : 'e.g. 245.50'}
                  />
                </div>
              ))}

              <div style={{
                padding: 14, border: 'var(--of-line)', background: 'var(--of-warm)',
                fontFamily: '"JetBrains Mono", monospace', fontSize: '0.8rem',
                marginBottom: 20
              }}>
                <EyeOff size={14} style={{ display: 'inline', marginRight: 6 }} />
                This order will be private. Only matched counterparties will see it.
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button className="of-btn of-btn-dark" style={{ flex: 1, justifyContent: 'center' }} onClick={handleCreate}>
                  <Lock size={14} /> Create Private Order
                </button>
                <button className="of-btn of-btn-outline" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowCreate(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="of-orderbook">
          <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: 'var(--of-line)' }}>
            {['orders', 'trades'].map(tab => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab as 'orders' | 'trades')}
                style={{
                  padding: '12px 28px',
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '0.85rem', fontWeight: 800,
                  border: 'none', borderBottom: selectedTab === tab ? '3px solid var(--of-ink)' : '3px solid transparent',
                  background: 'transparent',
                  color: selectedTab === tab ? 'var(--of-ink)' : 'var(--of-muted)',
                  textTransform: 'uppercase',
                }}
              >
                {tab} {tab === 'orders' ? `(${MOCK_ORDERS.length})` : `(${MOCK_TRADES.length})`}
              </button>
            ))}
          </div>

          {selectedTab === 'orders' ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="of-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Side</th>
                    <th>Asset</th>
                    <th>Type</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Counterparty</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_ORDERS.map(order => (
                    <tr key={order.id}>
                      <td style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.8rem' }}>{order.id}</td>
                      <td>
                        <span className={`of-tag ${order.side === 'Buy' ? 'of-tag-buy' : 'of-tag-sell'}`}>
                          {order.side}
                        </span>
                      </td>
                      <td style={{ fontWeight: 800 }}>{order.asset}</td>
                      <td>{order.type}</td>
                      <td>{order.quantity}</td>
                      <td>${order.price}</td>
                      <td style={{ fontWeight: 800 }}>${order.total}</td>
                      <td>
                        <span className={`of-tag ${order.status === 'Open' ? 'of-tag-open' : order.status === 'Matched' ? 'of-tag-settled' : ''}`}>
                          {order.status}
                        </span>
                      </td>
                      <td style={{ color: 'var(--of-muted)' }}>
                        {order.counterparty || (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <EyeOff size={12} /> Private
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="of-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Asset</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Total</th>
                    <th>Buyer</th>
                    <th>Seller</th>
                    <th>Status</th>
                    <th>Settled</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_TRADES.map(trade => (
                    <tr key={trade.id}>
                      <td style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.8rem' }}>{trade.id}</td>
                      <td style={{ fontWeight: 800 }}>{trade.asset}</td>
                      <td>{trade.quantity}</td>
                      <td>${trade.price}</td>
                      <td style={{ fontWeight: 800 }}>${trade.total}</td>
                      <td>{trade.buyParty}</td>
                      <td>{trade.sellParty}</td>
                      <td>
                        <span className={`of-tag ${trade.status === 'Settled' ? 'of-tag-settled' : ''}`}>
                          {trade.status}
                        </span>
                      </td>
                      <td style={{ color: 'var(--of-muted)' }}>
                        {trade.settledAt ? new Date(trade.settledAt).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Privacy note */}
        <div style={{
          marginTop: 40, padding: 20, border: 'var(--of-line)', background: 'var(--of-warm)',
          display: 'flex', alignItems: 'center', gap: 12
        }}>
          <ShieldCheck size={20} />
          <div>
            <strong style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.85rem' }}>Privacy Guarantee</strong>
            <p style={{ margin: '4px 0 0', color: 'var(--of-muted)', fontSize: '0.85rem' }}>
              All orders and trades on Obscura are private to the involved parties.
              Canton's ledger ensures third parties cannot see your positions, counterparties, or pricing.
              This is not a promise — it's enforced by the protocol.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
