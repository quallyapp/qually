# Qually — Trustless Bounty Infrastructure on Sui

> Store. Judge. Ship. A decentralized bounty platform where every piece of data — briefs, submissions, judge credentials, profiles — lives on **Walrus**, with all chain interactions powered by **Sui Network**.

## What is Qually?

Qually is a trustless bounty infrastructure on Sui where:

- **Posters** create bounties with SUI escrowed in a Move smart contract
- **Hunters** submit work stored on Walrus decentralized storage
- **Judges** apply with on-chain stake, vote via commit-reveal, and earn reputation
- **Payouts** are automatic and trustless — no middleman, no dispute resolution needed

Every piece of data is stored on **Walrus** — making briefs, submissions, profiles, and dispute evidence verifiable, censorship-resistant, and permanently accessible.

## Features

### Bounty Types
- **Fixed Price** — Single winner, set reward
- **Contest** — Multiple winners, split prize pool
- **Grant** — Milestone-based escrow (coming soon)

### Category-Specific Requirements
Each category has customizable required submission fields:
- **Development:** GitHub repo, demo link, docs, test coverage
- **Design:** Image upload, Figma link, live preview
- **Content Creation:** X/Twitter, TikTok, YouTube, blog links
- **Security:** Audit report, PoC code, fix PR
- **Documentation:** Docs link, GitHub PR, preview
- **Research:** Paper, data/analysis, slides
- **Infrastructure:** GitHub repo, deployment, architecture doc

### Judge System
- Judge profiles stored on Walrus (credentials, motivation, experience)
- On-chain staking with tier system (T0-T3)
- Commit-reveal voting with SHA3-256 verification
- Reputation tracking and slashing for missed reveals

### Platform Features
- **Boost Prize Pool** — Any wallet can boost, poster notified
- **Custom Timeline** — Poster creates milestones, edit/delete
- **Walrus Storage** — All metadata decentralized
- **Rich Text Editor** — TipTap for descriptions
- **Mark as Read** — Notification management
- **Bounties I'm Judging** — Judge dashboard view

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  TanStack Router · TanStack Query · dapp-kit · shadcn   │
├─────────────────────────────────────────────────────────┤
│                   Sui Network                           │
│           Testnet / Mainnet RPC                         │
├─────────────────────────────────────────────────────────┤
│                  Walrus Storage                          │
│  Publisher → /v1/blobs  |  Aggregator → /v1/blobs/:id  │
│  Briefs · Submissions · Profiles · Judge Credentials    │
├─────────────────────────────────────────────────────────┤
│              Sui Move Smart Contracts                    │
│  bounty · submission · judge · voting · payout · dispute │
│  milestone · profile · treasury                         │
└─────────────────────────────────────────────────────────┘
```

## Walrus Integration

Walrus is the **data layer** of the entire platform:

| What | Stored on Walrus | On-Chain Reference |
|------|-----------------|-------------------|
| **Bounty Briefs** | Title, description, category, requirements | `brief_blob_id` in Bounty object |
| **Submissions** | Work title, description, required fields | `blob_id` in Submission object |
| **User Profiles** | Nickname, bio, skills, social links | localStorage cache + Walrus blob |
| **Judge Profiles** | Credentials, motivation, experience | `blob_id` in JudgeProfile object |
| **Judge Applications** | Application details per bounty | `application_blob_id` |
| **Dispute Evidence** | Reason, supporting evidence | `evidence_blob_id` |
| **Milestone Deliveries** | Delivery description, links | `blob_id` in Milestone object |

## Smart Contracts (9 Move Modules)

| Module | Purpose |
|--------|---------|
| `bounty` | Bounty lifecycle: create, boost, veto, start_review, finalize. On-chain BountyRegistry for discovery |
| `submission` | Work submission with Walrus blob references |
| `judge` | Judge profiles, applications, approval, stake tiers. Auth-checked approval |
| `voting` | Commit-reveal voting: hash → commit → reveal → tally |
| `payout` | Prize distribution, reputation updates, slashing |
| `treasury` | Admin-only treasury management |
| `dispute` | Dispute filing with evidence, resolution. Auth-checked arbiter assignment |
| `milestone` | Grant milestone lifecycle. Auth-checked approval |
| `profile` | Poster and hunter profiles |

## Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Sui wallet (Slush, Sui Wallet, or Ethos)

### Frontend
```bash
cd frontend
cp .env.example .env
# Add your Tatum API key to .env
npm install
npm run dev
# → http://localhost:3000
```

### Environment Variables
```bash
# frontend/.env
VITE_TATUM_API_KEY=your_tatum_api_key_here
```

### Contracts
```bash
cd contracts/qually
sui move build
sui move test  # 38/38 passing
```

## Tech Stack

- **Frontend:** React 19, TanStack Router, TanStack Start (SSR), shadcn/ui, Tailwind CSS 4
- **Wallet:** @mysten/dapp-kit, @mysten/sui
- **Storage:** Walrus decentralized storage
- **Contracts:** Sui Move, 9 modules, 38 tests
- **Build:** Vite 7, TypeScript, Nitro (Vercel SSR)

## License

MIT
