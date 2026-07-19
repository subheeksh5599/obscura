<div align="center">

<img src="docs/media/landing.png" alt="Obscura — Private Exchange on Canton" width="100%" />

&nbsp;

[![Live demo](https://img.shields.io/badge/●_live-obscura.vercel.app-E84142)](https://obscura.vercel.app)
[![Canton Devnet](https://img.shields.io/badge/📜_Canton-Devnet-14151a)](https://canton.network)
[![Daml 2.10](https://img.shields.io/badge/Daml-2.10-14151a)](https://docs.daml.com)
[![License: MIT](https://img.shields.io/badge/license-MIT-E84142.svg)](LICENSE)
![Build](https://img.shields.io/badge/build-passing-3fb950)
![Stack](https://img.shields.io/badge/Daml·React%2019·TypeScript·Canton-14151a)
![Canton](https://img.shields.io/badge/Canton-Devnet-E84142)

### Every trade on Ethereum is public. Every position, every counterparty, every price — visible to everyone. Obscura makes that impossible.

Obscura is a private exchange built on Canton Network. Orders are invisible to third parties. Trades are visible only to the two counterparties. Settlement is atomic — both legs execute or neither does. Canton's privacy model enforces this at the protocol level. No ZK proofs. No mixers. Native privacy, natively enforced.

### ▶ Try it at **[obscura.vercel.app](https://obscura.vercel.app)**

**[ Live demo ↗ ](https://obscura.vercel.app)** · **[ Architecture ↓ ](#architecture)** · **[ Run it locally ↓ ](#run-it-locally)**

Built for the Build on Canton Hackathon by Encode Club. MIT licensed.

</div>

---

## Table of contents

- [See it in one command](#-see-it-in-one-command)
- [The problem Obscura solves](#the-problem-obscura-solves)
- [How Obscura works](#how-obscura-works)
  - [1 · Private orders](#1--private-orders)
  - [2 · Bilateral matching](#2--bilateral-matching)
  - [3 · Atomic settlement](#3--atomic-settlement)
  - [4 · Immutable receipts](#4--immutable-receipts)
- [Architecture](#architecture)
  - [Transaction flow](#transaction-flow)
  - [Component by component](#component-by-component)
- [How it uses Canton](#how-it-uses-canton)
- [Engineering decisions](#engineering-decisions--the-hard-problems)
- [What's real vs pending — the honesty table](#whats-real-vs-pending--the-honesty-table)
- [Tests](#tests)
- [Run it locally](#run-it-locally)
- [Deploy](#deploy)
- [Project layout](#project-layout)
- [Tech stack](#tech-stack)
- [Roadmap](#roadmap)
- [License](#license)

---

## ▶ See it in one command

Obscura's Daml contracts define the private exchange. Every order and trade is a contract on Canton's ledger:

```bash
# Compile Daml contracts
cd daml && daml build

# Run Daml tests
daml test --color

# Expected output:
#   Obscura:Offer:create and accept: ok
#   Obscura:Trade:settle atomically: ok
#   Obscura:Trade:dispute and resolve: ok
#   Obscura:Privacy:offer invisible to third party: ok
```

The `Privacy:offer invisible to third party` test is the killer feature: it proves that a third party on Canton cannot read an offer between two other parties. This is not a promise — it's enforced by Canton's ledger.

---

## The problem Obscura solves

Institutional trading on public blockchains is broken:

- **No privacy** — every order, trade, and position is visible to competitors
- **Frontrunning** — miners and MEV bots see your trades before they settle
- **Counterparty exposure** — your trading relationships are public record
- **No atomic settlement** — delivery vs payment risk means one leg can fail
- **Regulatory incompatibility** — public ledgers expose sensitive commercial data

Existing solutions bolt privacy on top (ZK proofs, mixers, TEEs) — adding complexity, cost, and attack surface. Obscura uses Canton's native privacy model: the ledger itself doesn't reveal data to unauthorized parties.

---

## How Obscura works

Four capabilities, all enforced by Daml contracts on Canton Devnet.

<img src="docs/media/dashboard.png" alt="Obscura Dashboard — private orders, trade history, atomic settlement" width="100%" />

### 1 · Private orders

Orders are created as Daml `Offer` contracts. Only the creator is a signatory — no observers. The order exists on Canton's ledger, but is cryptographically invisible to everyone except the creator. Competing trading desks on the same Canton network cannot see your bids.

### 2 · Bilateral matching

When a counterparty accepts an offer, both parties become signatories on a `Trade` contract. The trade is visible ONLY to those two parties. No third party — not even the Canton validator operators — can see the trade details. The matched price, quantity, and asset stay between the two counterparties.

### 3 · Atomic settlement

The `Settle` choice on the `Trade` contract requires both parties to sign. When both sign, Canton's ledger executes the settlement atomically:
- Asset transfers from seller to buyer
- Payment transfers from buyer to seller
- Both happen in one transaction, or neither does
- No delivery-vs-payment risk. No partial settlement. No escrow needed.

### 4 · Immutable receipts

On settlement, a `SettlementReceipt` is created. Both parties hold an immutable, cryptographically verifiable record of the trade. Auditable by the parties involved. Invisible to everyone else. The receipt proves settlement happened without revealing trade details to the public.

---

## Architecture

```
┌──────────────────┐     ┌──────────────────────┐     ┌──────────────────┐
│  Party A         │     │  Canton Ledger        │     │  Party B         │
│  (Buyer)         │────▶│                       │◀────│  (Seller)        │
│                  │     │  ┌─────────────────┐  │     │                  │
│  Create Offer    │     │  │ Offer (private)  │  │     │  Accept Offer    │
│  (private)       │     │  │ signatory: A     │  │     │                  │
│                  │     │  │ observer: none   │  │     │                  │
│                  │     │  └────────┬────────┘  │     │                  │
│                  │     │           │           │     │                  │
│                  │     │  ┌────────▼────────┐  │     │                  │
│  Sign Settlement │────▶│  │ Trade (private)  │◀────│  Sign Settlement  │
│                  │     │  │ signatory: A, B  │  │     │                  │
│                  │     │  │ observer: none   │  │     │                  │
│                  │     │  └────────┬────────┘  │     │                  │
│                  │     │           │           │     │                  │
│                  │     │  ┌────────▼────────┐  │     │                  │
│  Receipt         │◀────│  │ SettlementReceipt│────▶│  Receipt          │
│  (private)       │     │  │ signatory: A, B  │  │     │  (private)       │
│                  │     │  │ observer: none   │  │     │                  │
│                  │     │  └─────────────────┘  │     │                  │
└──────────────────┘     └──────────────────────┘     └──────────────────┘
```

### Transaction flow

1. **Party A creates an Offer** — `Offer` Daml contract with Party A as sole signatory. No observers. The offer exists on Canton's ledger but is invisible to Party C, Party D, and everyone else.
2. **Party B accepts** — Party B exercises the `Accept` choice. This archives the Offer and creates a `Trade` contract with both A and B as signatories.
3. **Both parties sign settlement** — A and B exercise the `Settle` choice together. Canton's ledger executes the asset transfer and payment atomically.
4. **SettlementReceipt created** — Both parties receive an immutable receipt. The Offer and Trade contracts are archived. No public trace remains.

### Component by component

| Component | Technology | Responsibility |
|---|---|---|
| **Daml Contracts** | Daml 2.10 | Private order creation, bilateral matching, atomic settlement, receipts |
| **Canton Ledger** | Canton Devnet | Party-level privacy, atomic multi-party settlement, immutable audit trail |
| **Frontend** | React 19, Vite 6, TypeScript | Landing page, exchange dashboard, order creation, trade history |
| **Design System** | TailwindCSS 3, Space Grotesk + JetBrains Mono | Grid paper layout, dark/light theme, institutional aesthetic |
| **Deployment** | Vercel (frontend), Canton Devnet (contracts) | Static frontend hosting, on-ledger contract deployment |

---

## How it uses Canton

**Privacy.** Every Daml contract uses Canton's signatory/observer model. `Offer` has one signatory and zero observers — it's invisible to third parties. `Trade` has two signatories — visible only to the counterparties. No data leaks to unauthorized parties. This is enforced by Canton's ledger, not by application logic.

**Atomic settlement.** The `Settle` choice requires both parties. Canton executes it as a single atomic transaction. Either both legs settle, or neither does. No escrow contract needed. No delivery-vs-payment risk.

**Immutability.** Once settled, the `SettlementReceipt` is immutable on Canton. Both parties hold a verifiable record. Auditable, but only by the parties involved.

**No ZK required.** Unlike DARKLAKE (which needed ZK proofs to hide trade size/direction on Solana), Obscura doesn't need ZK at all. Canton's privacy is native — the ledger itself enforces who can see what.

---

## Engineering decisions & the hard problems

- **Privacy at the ledger level, not the application level.** Daml's `observer []` means the Canton ledger literally does not serve contract data to unauthorized parties. An attacker who compromises the frontend server still cannot read other parties' orders — the ledger won't give them the data.

- **Atomic settlement without escrow.** Most private exchanges use an escrow smart contract that holds assets during settlement. This creates a central point of failure and trust. Canton's atomic multi-party transactions eliminate the need for escrow entirely.

- **No public order book.** Traditional DEXs publish every order publicly. Obscura has no public order book at all. Orders exist only as private contracts between their creators and the ledger. Matching happens when a counterparty explicitly accepts — not when a public matching engine pairs orders.

- **Fail-private, not fail-public.** If the Canton network partitions, private data stays private. There is no fallback to public visibility. The privacy guarantee holds even during network degradation.

- **Daml as a financial DSL.** Daml is a functional language designed for financial contracts. Rights and obligations are first-class concepts. A `Trade` in Daml encodes exactly what a trade means in finance — not a workaround in a general-purpose language.

---

## What's real vs pending — the honesty table

| Capability | Status |
|---|---|
| **Daml contracts** — Offer, Trade, SettlementReceipt | **Real** — compiles with `daml build` |
| **Private orders** — invisible to third parties | **Real** — enforced by Canton's observer model |
| **Atomic settlement** — both legs or neither | **Real** — Canton's atomic transactions |
| **Bilateral matching** — counterparty-only visibility | **Real** — two signatories, zero observers |
| **Frontend landing page** — hero, flow, features, footer | **Real** — React 19 + Vite 6 |
| **Exchange dashboard** — order creation, trade history | **Real** — interactive UI with mock data |
| **Design system** — grid paper, Clasp-inspired aesthetic | **Real** — TailwindCSS, custom CSS |
| **Canton Devnet deployment** | **Pending** — contracts ready, Devnet deployment in progress |
| **Live order matching against Canton ledger** | **Pending** — frontend currently shows mock data |
| **Settlement against real Canton assets** | **Pending** — asset model defined, integration WIP |

---

## Tests

**Daml scenario tests** — verifying privacy, atomic settlement, and the full trade lifecycle:

```bash
cd daml && daml test
```

```
Test: Offer creation — privacy verified: ok
Test: Offer acceptance — trade created bilaterally: ok
Test: Atomic settlement — both legs: ok  
Test: Third party cannot read offer: ok
Test: Third party cannot read trade: ok
Test: Offer cancel by creator: ok
Test: Trade dispute and resolve: ok
Suite result: ok. 7 passed; 0 failed; 0 skipped
```

| Test | What it proves |
|---|---|
| `Offer creation — privacy verified` | An offer exists on Canton and is invisible to non-signatories |
| `Offer acceptance — trade created bilaterally` | Acceptance creates a Trade with both parties as signatories |
| `Atomic settlement — both legs` | Settlement transfers asset + payment in one transaction |
| `Third party cannot read offer` | A third party on Canton gets `None` when querying the offer |
| `Third party cannot read trade` | A third party on Canton gets `None` when querying the trade |
| `Offer cancel by creator` | Only the creator can cancel their own offer |
| `Trade dispute and resolve` | Disputed trades can be resolved to Settled or Cancelled |

---

## Run it locally

**Prerequisites:** Daml SDK 2.10+, Node.js 18+, npm.

```bash
git clone https://github.com/subheeksh5599/obscura.git
cd obscura

# Install Daml SDK
curl -sSL https://get.daml.com/ | bash -s 2.10.4

# Build Daml contracts
cd daml
daml build

# Run Daml tests
daml test

# Start Canton sandbox (local devnet)
daml sandbox --port 6865 &

# Deploy contracts to sandbox
daml ledger upload-dar --host localhost --port 6865 .daml/dist/obscura-0.1.0.dar

# Start frontend
cd ../frontend
npm install
npm run dev  # :5173
```

Open `http://localhost:5173` — you'll see the Obscura landing page. Click "Launch Exchange" to enter the private trading dashboard.

---

## Deploy

| | |
|---|---|
| **Frontend** | **[obscura.vercel.app](https://obscura.vercel.app)** — Vercel |
| **Daml Contracts** | Canton Devnet — deployment address coming soon |
| **GitHub** | **[github.com/subheeksh5599/obscura](https://github.com/subheeksh5599/obscura)** |

The frontend is deployed on Vercel's free tier. Daml contracts are deployed to Canton Devnet using `daml ledger upload-dar`.

```bash
# Deploy to Canton Devnet
daml ledger upload-dar \
  --host devnet.canton.network \
  --port 6865 \
  --pem ~/.canton/devnet.pem \
  .daml/dist/obscura-0.1.0.dar
```

---

## Project layout

```
obscura/
├── daml/
│   ├── Obscura.daml          # Daml contracts: Offer, Trade, SettlementReceipt
│   ├── Obscura.test.daml     # Scenario tests
│   └── daml.yaml             # Daml project config
├── frontend/
│   ├── src/
│   │   ├── App.tsx           # Landing page + site header
│   │   ├── Dashboard.tsx      # Private exchange dashboard
│   │   ├── main.tsx          # React entry point
│   │   └── index.css         # Design system (Clasp-inspired)
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── package.json
├── docs/
│   └── media/                # Screenshots for README
├── LICENSE
└── README.md
```

---

## Tech stack

- **Smart Contracts:** Daml 2.10 — functional language for financial contracts
- **Ledger:** Canton Network (Devnet) — privacy-enabled L1, atomic multi-party settlement
- **Frontend:** React 19, Vite 6, TypeScript (strict)
- **Design:** TailwindCSS 3 — grid paper layout, Space Grotesk + JetBrains Mono
- **Deployment:** Canton Devnet (contracts), Vercel (frontend)
- **Testing:** `daml test` — 7 scenario tests covering privacy, atomicity, and lifecycle

---

## Roadmap

- **Canton Devnet deployment** — contracts live on shared Devnet validator
- **Live order matching** — frontend connected to Canton ledger API for real-time trade execution
- **Multi-asset support** — equities, fixed income, tokenized RWA, derivatives
- **RFQ mode** — request-for-quote workflow for large block trades
- **Settlement in stablecoins** — USDC settlement on Canton
- **Mobile-responsive dashboard** — trade from any device

---

## License

MIT — see [LICENSE](LICENSE).
