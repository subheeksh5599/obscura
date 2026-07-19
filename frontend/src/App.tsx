import { useState } from 'react'
import { Dashboard } from './Dashboard'
import { ShieldCheck, ArrowRight, Lock, EyeOff, Zap } from 'lucide-react'

export default function App() {
  const [page, setPage] = useState<'landing' | 'dashboard'>('landing')

  return page === 'landing' ? <Landing onEnter={() => setPage('dashboard')} /> : <Dashboard />
}

function SiteHeader({ onEnter }: { onEnter: () => void }) {
  return (
    <header className="of-header" style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 90,
      minHeight: 72, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto',
      border: 'var(--of-line)', background: 'var(--of-paper)'
    }}>
      <a href="#" className="of-header-brand" style={{
        display: 'flex', gap: 14, alignItems: 'center', padding: '10px 28px', textDecoration: 'none'
      }}>
        <strong style={{ fontSize: '1.25rem', lineHeight: 1, fontFamily: '"JetBrains Mono", monospace' }}>OBSCURA</strong>
        <small style={{ color: 'var(--of-muted)', fontSize: '0.82rem', fontWeight: 700 }}>Private Exchange · Canton</small>
      </a>
      <div style={{ display: 'flex', alignItems: 'stretch' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 18,
          borderLeft: 'var(--of-line)', padding: '0 24px',
          fontSize: '0.82rem', fontFamily: '"JetBrains Mono", monospace'
        }}>
          <span style={{ color: 'var(--of-muted)' }}>Canton Devnet</span>
          <b style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <i style={{ width: 9, height: 9, background: 'var(--of-mint)', border: '1px solid var(--of-ink)' }} />
            Live
          </b>
        </div>
        <button
          onClick={onEnter}
          style={{
            minWidth: 172, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            borderLeft: 'var(--of-line)', background: 'var(--of-ink)', color: 'var(--of-paper)',
            fontSize: '0.88rem', fontWeight: 900, padding: '0 24px',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--of-blue)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--of-ink)')}
        >
          Launch App <ArrowRight size={16} style={{ marginLeft: 8 }} />
        </button>
      </div>
    </header>
  )
}

export function Landing({ onEnter }: { onEnter: () => void }) {
  const steps = [
    ['01', 'Create Offer', 'Place a private buy or sell order. Only you see it until matched. Price, quantity, asset — all confidential.'],
    ['02', 'Match', 'When a counterparty accepts, a bilateral trade is created. Both parties become signatories. No one else can see the trade.'],
    ['03', 'Settle Atomically', 'Both parties sign. Assets and payment settle simultaneously. No delivery-vs-payment risk. All or nothing.'],
    ['04', 'Private Receipt', 'A settlement receipt is issued to both parties. Immutable on Canton. Zero public leakage.'],
  ] as const

  const features = [
    ['01', 'Blind Orders', 'Bids and asks never appear on a public book. Only matched counterparties see each other. No frontrunning.', 'mint'],
    ['02', 'Atomic Settlement', 'Asset transfer + payment execute in one transaction. If either leg fails, both revert. No DvP risk.', 'blue'],
    ['03', 'Zero MEV', 'No mempool. No public order flow. No miner extractable value. Trade sizes and prices stay hidden until settlement.', 'orange'],
    ['04', 'Institutional Privacy', 'Built for banks, funds, and trading desks. Counterparties, positions, and pricing are confidential by design.', 'violet'],
    ['05', 'On-Chain Audit', 'Every trade is recorded on Canton. Both parties hold an immutable receipt. Auditable, but only by the parties involved.', 'yellow'],
    ['06', 'Daml Contracts', 'Smart contracts in Daml — a functional language designed for financial workflows. Canton native, not ported.', 'lavender'],
  ] as const

  return (
    <main style={{ paddingTop: 72, minHeight: '100vh' }}>
      <SiteHeader onEnter={onEnter} />

      {/* Hero */}
      <section className="of-hero of-grid-paper">
        <div className="of-hero-copy">
          <p className="of-kicker">
            <span>Canton Network</span> Private Exchange · Institutional-Grade
          </p>
          <h1>OBSCURA</h1>
          <h2>Trade privately. Settle atomically. Leave no trace.</h2>
          <p className="of-hero-text">
            A confidential dark pool for institutional trading on Canton Network.
            Orders, counterparties, and prices stay hidden. Settlement is atomic —
            no delivery-vs-payment risk. Built with Daml smart contracts on Canton Devnet.
          </p>
          <div className="of-hero-actions">
            <button className="of-btn of-btn-dark" onClick={onEnter}>
              Launch Exchange <ArrowRight size={16} />
            </button>
            <a href="#how" className="of-btn of-btn-outline">How it works</a>
          </div>
          <p className="of-safety-line">
            <ShieldCheck size={17} /> Private orders. Atomic settlement. Zero public order book.
          </p>
        </div>
        <aside className="of-hero-rail">
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            minHeight: '100%', padding: 60, color: 'var(--of-paper)',
            background: 'var(--of-ink)', gap: 30
          }}>
            <EyeOff size={80} strokeWidth={1.5} />
            <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.8rem', fontWeight: 800, textAlign: 'center', lineHeight: 1.8 }}>
              <div style={{ color: 'var(--of-mint)' }}>✓ Order created</div>
              <div style={{ color: 'var(--of-blue)' }}>✓ Counterparty matched</div>
              <div style={{ color: 'var(--of-violet)' }}>✓ Trade settled atomically</div>
              <div style={{ color: 'var(--of-muted)' }}>○ No public trace</div>
            </div>
          </div>
        </aside>
      </section>

      {/* How it works */}
      <section id="how" className="of-section dark">
        <div className="of-section-top dark">
          <span>How it works</span>
          <span>&lt;flow&gt; create / match / settle / receipt &lt;/flow&gt;</span>
        </div>
        <div className="of-section-heading">
          <h2>From private order to atomic settlement.</h2>
          <p>Four steps. Two parties. Zero public visibility.</p>
        </div>
        <div className="of-flow-grid">
          {steps.map(([num, title, body], i) => (
            <article className="of-step" key={title} style={{ color: 'var(--of-paper)' }}>
              <span>{num}</span>
              <h3>{title}</h3>
              <p style={{ color: 'rgb(238 241 246 / 0.72)' }}>{body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="of-section">
        <div className="of-section-top">
          <span>Product surfaces</span>
          <span>&lt;privacy&gt; built into the ledger &lt;/privacy&gt;</span>
        </div>
        <div className="of-section-heading">
          <h2>Why Canton is the only chain this works on.</h2>
        </div>
        <div className="of-feature-grid">
          {features.map(([num, title, body, tone]) => (
            <article className={`of-feature tone-${tone}`} key={title}>
              <span>{num}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Stack */}
      <section className="of-section dark">
        <div className="of-section-top dark">
          <span>Built with</span>
          <span>&lt;stack&gt; Canton-native, institutional &lt;/stack&gt;</span>
        </div>
        <div className="of-stack-content">
          <div>
            <h2>Infrastructure you can verify.</h2>
            <p style={{ color: 'rgb(238 241 246 / 0.72)', marginTop: 16, lineHeight: 1.6 }}>
              Daml smart contracts on Canton Devnet. Every trade is a contract on the ledger.
              Privacy is protocol-level, not bolted on.
            </p>
          </div>
          <div className="of-stack-table">
            {['Canton Network', 'Daml 2.10', 'Atomic Settlement', 'Party-level Privacy', 'React 19 + Vite', 'TypeScript'].map((item, i) => (
              <span key={item} style={{ borderColor: 'rgb(255 255 255 / 0.1)' }}>
                <b>{String(i + 1).padStart(2, '0')}</b>
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="of-footer">
        <div className="of-footer-inner">
          <div>
            <p className="of-kicker" style={{ marginBottom: 8 }}>The missing privacy layer for institutional trading.</p>
            <h2>Create. Match. Settle. <br />In the dark.</h2>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="of-btn of-btn-dark" onClick={onEnter}>
              Launch Exchange <ArrowRight size={16} />
            </button>
          </div>
        </div>
        <div className="of-footer-links">
          <span>OBSCURA</span>
          <a href="#how">How it works</a>
          <a href="https://github.com/subheeksh5599/obscura" target="_blank" rel="noopener">GitHub</a>
          <a href="https://canton.network" target="_blank" rel="noopener">Canton Network</a>
        </div>
      </footer>
    </main>
  )
}
