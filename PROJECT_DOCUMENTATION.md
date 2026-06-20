# OmniDeploy IDE — Complete Project Documentation

> **Version:** 1.0.0  
> **Last Updated:** June 20, 2026  
> **Purpose:** Comprehensive technical reference for integrating OmniDeploy IDE as a feature into another project.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Tech Stack Summary](#3-tech-stack-summary)
4. [Full Directory Structure](#4-full-directory-structure)
5. [Frontend — Dependencies & Versions](#5-frontend--dependencies--versions)
6. [Backend — Dependencies & Versions](#6-backend--dependencies--versions)
7. [Environment Variables](#7-environment-variables)
8. [Frontend — Detailed File Breakdown](#8-frontend--detailed-file-breakdown)
9. [Backend — Detailed File Breakdown](#9-backend--detailed-file-breakdown)
10. [Database Schema (Supabase)](#10-database-schema-supabase)
11. [API Endpoints — Full Reference](#11-api-endpoints--full-reference)
12. [Data Models / Schemas (Pydantic)](#12-data-models--schemas-pydantic)
13. [Supported Blockchain Networks](#13-supported-blockchain-networks)
14. [Wallet Integration Details](#14-wallet-integration-details)
15. [Component Dependency Graph](#15-component-dependency-graph)
16. [Startup Scripts](#16-startup-scripts)
17. [Integration Guide](#17-integration-guide)
18. [Configuration Files](#18-configuration-files)

---

## 1. Project Overview

**OmniDeploy IDE** is a unified, browser-based, multi-chain smart contract IDE. It allows users to write, compile, and deploy Solidity and Rust/Anchor smart contracts to multiple blockchains from a single interface — no more switching between Remix IDE and Solana Playground.

### Core Capabilities

| Feature | Description |
|---------|-------------|
| **Multi-Chain Deploy** | Deploy to Ethereum Sepolia, Monad Testnet, Polygon Amoy, Arbitrum Sepolia & Solana Devnet |
| **Smart Compiler** | Server-side Solidity compilation via `py-solc-x` with ABI & bytecode output |
| **Wallet Integration** | MetaMask / WalletConnect for EVM chains via Reown AppKit + wagmi |
| **Project Manager** | Save, load, and manage projects in the cloud via Supabase |
| **VS Code Editor** | Monaco Editor with Solidity & Rust syntax highlighting |
| **Deployment History** | Track contract addresses, tx hashes, and explorer links |
| **Contract Templates** | Built-in ERC-20, ERC-721, and Anchor program templates |
| **Terminal Output** | Real-time compile/deploy log output in an integrated terminal |

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       Browser (Client)                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   Next.js 16 Frontend                     │   │
│  │  ┌────────────┐  ┌─────────────┐  ┌──────────────────┐  │   │
│  │  │   Monaco    │  │  Reown AppKit│  │  Supabase Client │  │   │
│  │  │   Editor    │  │  + wagmi     │  │  (anon key)      │  │   │
│  │  │   (code)    │  │  + viem      │  │                  │  │   │
│  │  └────────────┘  └──────┬──────┘  └──────────────────┘  │   │
│  │                         │                                 │   │
│  │            ┌────────────┴────────────┐                    │   │
│  │            │   Wallet Providers       │                    │   │
│  │            │   (MetaMask, WalletConnect) │                 │   │
│  │            └─────────────────────────┘                    │   │
│  └──────────────────────┬───────────────────────────────────┘   │
│                         │ HTTP (REST)                            │
└─────────────────────────┼───────────────────────────────────────┘
                          │
┌─────────────────────────┼───────────────────────────────────────┐
│                    FastAPI Backend (Port 8000)                   │
│  ┌──────────────────┐  ┌────────────────┐  ┌────────────────┐  │
│  │  Compile Router   │  │ Projects Router │  │Deploy Router   │  │
│  │  /api/compile/*   │  │ /api/projects/* │  │/api/deployments│  │
│  └────────┬─────────┘  └────────┬───────┘  └────────┬───────┘  │
│           │                     │                    │           │
│  ┌────────┴─────────┐  ┌───────┴────────────────────┘           │
│  │ Solidity Compiler │  │    Supabase Client                    │
│  │ (py-solc-x)       │  │    (service role key)                 │
│  └──────────────────┘  └────────────────────┐                   │
└─────────────────────────────────────────────┼───────────────────┘
                                              │
                                   ┌──────────┴──────────┐
                                   │   Supabase (Cloud)   │
                                   │   PostgreSQL DB      │
                                   │   Tables:            │
                                   │   - projects         │
                                   │   - files            │
                                   │   - deployments      │
                                   └─────────────────────┘
```

### Communication Flow

1. **Frontend ↔ Backend**: REST API calls over HTTP (`fetch`) to `http://localhost:8000`
2. **Frontend ↔ Blockchain**: Direct wallet interaction via `wagmi` hooks (`useWalletClient`, `usePublicClient`) — contract deployment happens client-side
3. **Backend ↔ Supabase**: Server-side database operations using the `supabase` Python client with a **service role key**
4. **Frontend ↔ Supabase**: Client-side reads only, using the **anon key** (minimal usage; most DB ops go through the backend)

---

## 3. Tech Stack Summary

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend Framework** | Next.js (App Router) | `16.2.9` |
| **UI Library** | React | `19.2.4` |
| **Language** | TypeScript | `5.9.3` |
| **Code Editor** | Monaco Editor (`@monaco-editor/react`) | `4.7.0` |
| **EVM Wallet SDK** | Reown AppKit (`@reown/appkit`) | `1.8.21` |
| **EVM Wallet Adapter** | Reown AppKit Wagmi Adapter | `1.8.21` |
| **EVM Hooks** | wagmi | `2.15.6` |
| **EVM Client** | viem | `2.21.0` |
| **React Query** | TanStack React Query | `5.101.0` |
| **Database Client (Frontend)** | Supabase JS | `2.108.2` |
| **Icons** | lucide-react | `1.21.0` |
| **CSS Framework** | Tailwind CSS v4 | `4.3.1` |
| **PostCSS Plugin** | `@tailwindcss/postcss` | `4.x` |
| **Linting** | ESLint + eslint-config-next | `9.39.4` / `16.2.9` |
| **Bundler** | Turbopack (via Next.js) | Built-in |
| **Backend Framework** | FastAPI | `0.111.0` |
| **ASGI Server** | Uvicorn | `0.30.1` |
| **Validation** | Pydantic | `2.7.1` |
| **Solidity Compiler** | py-solc-x | `2.0.2` |
| **HTTP Client** | httpx | `0.27.0` |
| **Environment** | python-dotenv | `1.0.1` |
| **Database Client (Backend)** | Supabase Python | `2.4.3` |
| **Multipart** | python-multipart | `0.0.9` |
| **Database** | Supabase (hosted PostgreSQL) | Cloud |
| **Font** | Inter (Google Fonts) | Web |
| **Mono Font** | JetBrains Mono (Google Fonts) | Web |

---

## 4. Full Directory Structure

```
IDE/
├── README.md                           # Project overview
├── PROJECT_DOCUMENTATION.md            # This file
├── start-all.bat                       # Starts both frontend + backend
├── start-backend.bat                   # Starts backend only
│
├── backend/                            # Python FastAPI backend
│   ├── .env                            # Environment template (secrets)
│   ├── main.py                         # FastAPI app entry point (CORS, routers)
│   ├── requirements.txt                # Python dependencies (pinned)
│   ├── supabase_schema.sql             # Full database DDL for Supabase
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   └── schemas.py                  # Pydantic request/response models
│   │
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── compile.py                  # POST /api/compile/solidity, GET /api/compile/versions
│   │   ├── projects.py                 # CRUD: /api/projects/*
│   │   └── deployments.py              # POST & GET: /api/deployments/*
│   │
│   └── services/
│       ├── __init__.py
│       ├── solidity_compiler.py         # py-solc-x wrapper (compile, install, versions)
│       └── supabase_client.py           # Singleton Supabase client
│
└── frontend/                           # Next.js 16 app
    ├── .env.local                       # Frontend env vars
    ├── .gitignore
    ├── AGENTS.md                        # Agent instructions
    ├── CLAUDE.md                        # Claude instructions
    ├── README.md                        # Frontend README
    ├── package.json                     # npm dependencies
    ├── package-lock.json                # Lockfile (exact versions)
    ├── tsconfig.json                    # TypeScript config
    ├── next.config.ts                   # Next.js config (Turbopack)
    ├── next-env.d.ts                    # Next.js env types
    ├── postcss.config.mjs               # PostCSS + Tailwind v4 plugin
    ├── eslint.config.mjs                # ESLint flat config
    │
    ├── app/                             # Next.js App Router pages
    │   ├── layout.tsx                   # Root layout (Inter font, Providers)
    │   ├── page.tsx                     # Landing page (/)
    │   ├── globals.css                  # Global stylesheet (700+ lines, design system)
    │   ├── favicon.ico
    │   │
    │   ├── ide/
    │   │   └── page.tsx                 # IDE page (/ide) — main editor workspace
    │   │
    │   └── dashboard/
    │       └── page.tsx                 # Dashboard (/dashboard) — projects & deployments
    │
    ├── components/
    │   ├── editor/
    │   │   ├── MonacoEditor.tsx          # Monaco editor with Solidity tokenizer
    │   │   ├── EditorTabs.tsx            # Tab bar for open files
    │   │   └── FileExplorer.tsx          # Sidebar file tree + templates
    │   │
    │   ├── deploy/
    │   │   ├── CompilePanel.tsx          # Compile settings & results panel
    │   │   └── DeployPanel.tsx           # Deploy UI, wallet status, deployed contracts
    │   │
    │   ├── layout/
    │   │   ├── Navbar.tsx                # IDE top navbar (logo, chain, save, wallet)
    │   │   └── Terminal.tsx              # Output terminal (logs, errors, success)
    │   │
    │   └── wallet/
    │       └── WalletButton.tsx          # Wallet connect button + chain selector dropdown
    │
    ├── lib/
    │   ├── wagmi-config.ts              # Wagmi + AppKit setup, chain configs, Monad custom chain
    │   └── supabase.ts                  # Frontend Supabase client (anon key)
    │
    ├── providers/
    │   └── Providers.tsx                 # WagmiProvider + QueryClientProvider + AppKit init
    │
    └── public/                          # Static assets
        ├── file.svg
        ├── globe.svg
        ├── next.svg
        ├── vercel.svg
        └── window.svg
```

---

## 5. Frontend — Dependencies & Versions

### Production Dependencies (`dependencies`)

| Package | Specified | Installed | Purpose |
|---------|-----------|-----------|---------|
| `next` | `16.2.9` | `16.2.9` | React framework with App Router, SSR, Turbopack |
| `react` | `19.2.4` | `19.2.4` | UI library |
| `react-dom` | `19.2.4` | `19.2.4` | React DOM renderer |
| `@monaco-editor/react` | `^4.7.0` | `4.7.0` | Monaco Editor React wrapper (VS Code engine) |
| `@reown/appkit` | `^1.8.21` | `1.8.21` | Reown (ex-WalletConnect) AppKit — wallet modal, account management |
| `@reown/appkit-adapter-wagmi` | `^1.8.21` | `1.8.21` | Wagmi adapter for Reown AppKit |
| `@supabase/supabase-js` | `^2.108.2` | `2.108.2` | Supabase JS client for frontend database access |
| `@tanstack/react-query` | `^5.101.0` | `5.101.0` | Async state management (required by wagmi) |
| `lucide-react` | `^1.21.0` | `1.21.0` | Icon library (unused in current components — available for future) |
| `viem` | `2.21.0` | `2.21.0` | TypeScript interface for Ethereum (low-level EVM client) |
| `wagmi` | `2.15.6` | `2.15.6` | React hooks for Ethereum (wallet, tx, contracts) |

### Dev Dependencies (`devDependencies`)

| Package | Specified | Installed | Purpose |
|---------|-----------|-----------|---------|
| `@tailwindcss/postcss` | `^4` | `4.x` | Tailwind CSS v4 PostCSS plugin |
| `@types/node` | `^20` | `20.x` | Node.js type definitions |
| `@types/react` | `^19` | `19.x` | React type definitions |
| `@types/react-dom` | `^19` | `19.x` | React DOM type definitions |
| `eslint` | `^9` | `9.39.4` | JavaScript/TypeScript linter |
| `eslint-config-next` | `16.2.9` | `16.2.9` | Next.js ESLint config (core web vitals + TS) |
| `tailwindcss` | `^4` | `4.3.1` | CSS utility framework (v4) |
| `typescript` | `^5` | `5.9.3` | TypeScript compiler |

### Overrides

| Package | Pinned Version | Reason |
|---------|---------------|--------|
| `@wagmi/connectors` | `5.7.13` | Compatibility with wagmi `2.15.6` + Reown AppKit |

### npm Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `next dev` | Start development server with hot reload (Turbopack) |
| `build` | `next build` | Production build |
| `start` | `next start` | Start production server |
| `lint` | `eslint` | Run ESLint checks |

---

## 6. Backend — Dependencies & Versions

### Python Dependencies (`requirements.txt`) — All Pinned

| Package | Version | Purpose |
|---------|---------|---------|
| `fastapi` | `0.111.0` | Async Python web framework (REST API) |
| `uvicorn[standard]` | `0.30.1` | ASGI server for FastAPI |
| `pydantic` | `2.7.1` | Data validation & serialization |
| `python-dotenv` | `1.0.1` | Load `.env` file into `os.environ` |
| `supabase` | `2.4.3` | Supabase Python client (DB operations) |
| `py-solc-x` | `2.0.2` | Solidity compiler manager & wrapper (downloads/manages `solc` binaries) |
| `httpx` | `0.27.0` | Async HTTP client (used by supabase client internally) |
| `python-multipart` | `0.0.9` | Multipart form data parsing (required by FastAPI for file uploads) |

### Python Version Requirement

- **Python 3.10+** (required by `supabase` and type union syntax `Client | None`)

---

## 7. Environment Variables

### Backend (`backend/.env`)

| Variable | Example Value | Required | Description |
|----------|---------------|----------|-------------|
| `SUPABASE_URL` | `https://xxxx.supabase.co` | ✅ Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOi...` | ✅ Yes | Service role key (full DB access — **keep secret**) |
| `SUPABASE_ANON_KEY` | `eyJhbGciOi...` | Optional | Anon key (not currently used in backend) |
| `FRONTEND_URL` | `http://localhost:3000` | Optional | CORS origin for frontend (defaults to localhost:3000) |

### Frontend (`frontend/.env.local`)

| Variable | Example Value | Required | Description |
|----------|---------------|----------|-------------|
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | `abc123def456` | ✅ Yes | WalletConnect Cloud project ID (get from [cloud.walletconnect.com](https://cloud.walletconnect.com)) |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` | ✅ Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOi...` | ✅ Yes | Supabase anon key (public, read-only) |
| `NEXT_PUBLIC_BACKEND_URL` | `http://localhost:8000` | ✅ Yes | Backend API base URL |

> **Note:** All `NEXT_PUBLIC_*` variables are exposed to the browser. Never put secrets here.

---

## 8. Frontend — Detailed File Breakdown

### 8.1 Entry & Layout

#### `app/layout.tsx` — Root Layout
- Imports Google Font **Inter** (weights 300–900) via `next/font/google`
- Sets the `--font-inter` CSS variable on `<html>`
- Wraps all pages in `<Providers>` (wagmi + react-query + AppKit)
- SEO metadata: title, description, keywords

#### `app/globals.css` — Design System (702 lines)
- Imports **Inter** and **JetBrains Mono** from Google Fonts
- Defines 60+ CSS custom properties (design tokens):
  - Background layers: `--bg-base` (#05050f) through `--bg-hover`
  - Brand colors: purple, cyan, green, red, yellow, pink
  - Gradients, text, borders, glass effects, chain-specific colors
  - Spacing: sidebar width (240px), panel height (260px), navbar (56px)
  - Border radii, font stacks, shadows
- Full component styles: buttons (6 variants), badges (5 variants), inputs
- IDE layout (flexbox): root, body, sidebar, main, editor area, right panel, bottom panel
- Navbar, editor tabs, file explorer, panel tabs, terminal
- Chain selector dropdown, ABI viewer, status indicators
- 6 keyframe animations: pulse, spin, fadeIn, slideInRight, glow-pulse
- Landing page: hero, background gradients, grid overlay, feature cards
- Responsive breakpoints: hides sidebar + right panel below 900px

#### `providers/Providers.tsx` — Client-Side Provider Stack
- Initializes Reown AppKit with `createAppKit()` (runs once client-side)
- Configures: dark theme, accent color `#6366f1`, 8px border radius
- Wraps children in: `WagmiProvider` → `QueryClientProvider`
- **Depends on:** `@/lib/wagmi-config` (adapter, networks, projectId, queryClient)

---

### 8.2 Pages

#### `app/page.tsx` — Landing Page (`/`)
- **Client component** (`'use client'`)
- Displays: hero section, chain pills, CTA buttons, IDE mockup preview, 6 feature cards
- Feature cards: Multi-Chain Deploy, Smart Compiler, Wallet Integration, Project Manager, VS Code Editor, Deployment History
- Links to `/ide` and `/dashboard`
- **Imports:** `CHAIN_CONFIGS` from wagmi-config

#### `app/ide/page.tsx` — IDE Page (`/ide`) — **432 lines, core of the app**
- **Client component** with full IDE workspace
- **State management:**
  - `files` — array of `FileTab` objects (id, name, content, language, isDirty)
  - `activeTabId` — currently selected file
  - `selectedChain` — active blockchain target (`ChainKey`)
  - `terminalLines` — log output
  - `rightTab` — 'compile' or 'deploy' panel
  - `compileResults` — compiled contract ABI/bytecode
  - `projectName` — editable project name
  - `bottomH` — resizable terminal panel height
- **Built-in templates:** Default Solidity contract, ERC-20, ERC-721, Anchor/Rust
- **Features:** file CRUD, save project to backend, resizable terminal
- **Subcomponents used:** Navbar, FileExplorer, EditorTabs, MonacoEditor, CompilePanel, DeployPanel, Terminal

#### `app/dashboard/page.tsx` — Dashboard Page (`/dashboard`)
- **Client component**
- Fetches user's projects & deployments from backend on mount (by wallet address)
- Two tabs: Projects grid and Deployments list
- Project cards: name, language badge, chain indicator, delete button
- Deployment records: contract name, address, chain, explorer link, copy button
- Requires wallet connection to display data

---

### 8.3 Components

#### `components/editor/MonacoEditor.tsx` — Code Editor
- **Dynamic import** (`next/dynamic`) with SSR disabled for Monaco
- Registers custom **Solidity language** with Monarch tokenizer:
  - 30+ keywords (pragma, contract, function, mapping, etc.)
  - Tokenizes: comments, strings, numbers, hex literals, operators, brackets
- Editor options: fontSize 14, JetBrains Mono font, font ligatures, minimap, bracket pair colorization, smooth cursor animation, word wrap
- Theme: `vs-dark`
- Includes template strings for Solidity and Rust/Anchor

#### `components/editor/EditorTabs.tsx` — File Tab Bar
- Exports `FileTab` interface (used throughout the app)
- Renders tabs with language icons (📄 solidity, 🦀 rust, {} json)
- Shows dirty indicator (yellow dot) for unsaved changes
- Close button appears on hover

#### `components/editor/FileExplorer.tsx` — Sidebar File Tree
- Displays project files with language-specific icons
- "New file" button with inline input (auto-detects language from extension)
- Right-click to reveal delete option
- **Templates section:** Quick-add ERC-20 Token, ERC-721 NFT, Anchor Program

#### `components/deploy/CompilePanel.tsx` — Compile Settings & Output
- Solc version selector: `0.8.24`, `0.8.20`, `0.8.19`, `0.8.17`, `0.8.0`, `0.7.6`, `0.6.12`
- Optimizer toggle (default: enabled)
- Displays target network info (name, chain ID, type badge)
- Calls `POST /api/compile/solidity` on the backend
- Shows: compilation errors (red), warnings (yellow), compiled contracts (green + ABI viewer)
- On success: passes results to parent and auto-switches to Deploy tab

#### `components/deploy/DeployPanel.tsx` — Deploy UI
- Wallet connection status display
- Contract selector dropdown (when multiple contracts compiled)
- Constructor arguments input (comma-separated, JSON-parsed)
- Network info + faucet link
- Solana notice (Phase 2 — CLI-based deployment)
- **Deploy flow (EVM):**
  1. `walletClient.deployContract()` — sends transaction via MetaMask/WalletConnect
  2. `publicClient.waitForTransactionReceipt()` — waits for confirmation
  3. Displays contract address + explorer link
  4. Saves deployment record to backend (`POST /api/deployments/`)
- Shows deployed contracts list with explorer links and copy button

#### `components/layout/Navbar.tsx` — IDE Navigation Bar
- Logo (gradient text with hexagon icon)
- Editable project name input
- Chain selector (from WalletButton)
- Save button (calls `saveProject`)
- Wallet connect button
- Dashboard link

#### `components/layout/Terminal.tsx` — Output Console
- Exports `TerminalLine` interface: `type` (info/success/error/warning/command/address) + `text` + optional `timestamp`
- Auto-scrolls to bottom on new lines
- Line-count display + Clear button
- Color-coded output with type-specific prefixes ($, ✓, ✗, ⚠)
- Default message when empty

#### `components/wallet/WalletButton.tsx` — Wallet Connection
- **ChainSelector**: Dropdown to switch between 5 supported networks
  - Shows chain color dot, name, type (EVM/Solana), checkmark for active
  - Closes on outside click
- **WalletButton**: Two states:
  - Connected: shows green status dot + truncated address, opens AppKit modal on click
  - Disconnected: shows "Connect Wallet" button, opens AppKit modal

---

### 8.4 Libraries

#### `lib/wagmi-config.ts` — Chain & Wallet Configuration
- Defines **Monad Testnet** as a custom `AppKitNetwork` (chain ID 10143, RPC, block explorer)
- Imports `sepolia`, `polygonAmoy`, `arbitrumSepolia` from `@reown/appkit/networks`
- Creates `WagmiAdapter` with projectId + networks
- Creates `QueryClient` instance for React Query
- Exports `CHAIN_CONFIGS` — metadata object for all 5 chains:
  - `id`, `name`, `symbol`, `color` (hex), `explorer`, `rpc`, `type` (evm/solana), `faucet`
- Exports `ChainKey` type: `'sepolia' | 'monad' | 'polygonAmoy' | 'arbitrumSepolia' | 'solana'`

#### `lib/supabase.ts` — Frontend Database Client
- Creates Supabase client using `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Returns `null` if env vars are missing (graceful fallback)

---

## 9. Backend — Detailed File Breakdown

### 9.1 Entry Point

#### `main.py` — FastAPI Application
- Creates FastAPI app with title, description, version (`1.0.0`)
- **CORS middleware:** allows origins `localhost:3000`, `127.0.0.1:3000`, and `FRONTEND_URL` env var
- Includes 3 routers: `compile`, `projects`, `deployments`
- Root endpoint (`GET /`): returns app info JSON
- Health check (`GET /health`): returns `{"status": "ok"}`

---

### 9.2 Routers

#### `routers/compile.py` — Compilation Endpoints
- **`POST /api/compile/solidity`** — Compiles Solidity source code
  - Request: `CompileSolidityRequest` (source_code, compiler_version, optimize, optimize_runs)
  - Response: `CompileResponse` (success, contracts[], errors[], warnings[])
  - Delegates to `services/solidity_compiler.py`
- **`GET /api/compile/versions`** — Lists available solc versions
  - Returns latest 20 installable versions

#### `routers/projects.py` — Project CRUD
- **`POST /api/projects/`** — Create new project + files
  - Generates UUID, inserts into `projects` and `files` tables
- **`GET /api/projects/user/{wallet_address}`** — Get all projects for a wallet
  - Returns array sorted by `updated_at` DESC
- **`GET /api/projects/{project_id}`** — Get single project + its files
- **`PUT /api/projects/{project_id}`** — Update project name and/or files
  - Files are replaced entirely (delete all, re-insert)
- **`DELETE /api/projects/{project_id}`** — Delete project + cascade files

#### `routers/deployments.py` — Deployment Records
- **`POST /api/deployments/`** — Save deployment record
  - Stores: contract name, address, tx hash, chain, ABI, bytecode
- **`GET /api/deployments/user/{wallet_address}`** — Get deployment history
  - Returns latest 50 deployments sorted by `deployed_at` DESC

---

### 9.3 Services

#### `services/solidity_compiler.py` — Solidity Compilation Engine
- **`compile_solidity(source_code, compiler_version, optimize, optimize_runs)`**
  - Installs solc version if not present (`solcx.install_solc`)
  - Compiles with `solcx.compile_source()`
  - Output values: `abi`, `bin`, `bin-runtime`, `metadata`
  - Returns: `(contracts[], errors[], warnings[])`
  - Each contract: `{contract_name, abi, bytecode, deployed_bytecode}`
  - Error handling: parses `SolcError` into separate error/warning lines
- **`install_compiler(version)`** — Checks installed versions, installs if missing
- **`get_available_versions()`** — Returns installable versions (fallback list if network fails)
- **`_extract_contract_names(source_code)`** — Regex extraction of contract names

#### `services/supabase_client.py` — Database Singleton
- Lazy-initializes a Supabase `Client` using `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- Returns `None` if env vars are missing (graceful degradation)
- Uses module-level singleton pattern (`_client: Client | None`)

---

### 9.4 Models

#### `models/schemas.py` — Pydantic Data Models

**Compile Models:**

| Model | Fields | Purpose |
|-------|--------|---------|
| `CompileSolidityRequest` | `source_code: str`, `compiler_version: Optional[str] = "0.8.24"`, `optimize: Optional[bool] = True`, `optimize_runs: Optional[int] = 200` | Compile request body |
| `CompileOutput` | `contract_name: str`, `abi: List[Any]`, `bytecode: str`, `deployed_bytecode: str` | Single compiled contract |
| `CompileResponse` | `success: bool`, `contracts: Optional[List[CompileOutput]]`, `errors: Optional[List[str]]`, `warnings: Optional[List[str]]` | Compile response |

**Project Models:**

| Model | Fields | Purpose |
|-------|--------|---------|
| `FileItem` | `name: str`, `content: str`, `language: str` | Single file in a project |
| `CreateProjectRequest` | `name`, `chain`, `language`, `user_wallet`, `files: Optional[List[FileItem]]` | Create project request |
| `UpdateProjectRequest` | `name: Optional[str]`, `files: Optional[List[FileItem]]` | Update project request |
| `ProjectResponse` | `id`, `name`, `chain`, `language`, `user_wallet`, `files`, `created_at`, `updated_at` | Project response |

**Deployment Models:**

| Model | Fields | Purpose |
|-------|--------|---------|
| `SaveDeploymentRequest` | `project_id: Optional[str]`, `user_wallet`, `chain`, `chain_id: int`, `contract_name`, `contract_address`, `tx_hash`, `abi: List[Any]`, `bytecode: str` | Save deployment |
| `DeploymentResponse` | `id`, `user_wallet`, `chain`, `chain_id`, `contract_name`, `contract_address`, `tx_hash`, `deployed_at` | Deployment record |

---

## 10. Database Schema (Supabase)

### Extension Required
```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### Tables

#### `projects`
| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | `UUID` | PRIMARY KEY | `gen_random_uuid()` |
| `name` | `TEXT` | NOT NULL | — |
| `chain` | `TEXT` | NOT NULL | `'sepolia'` |
| `language` | `TEXT` | NOT NULL | `'solidity'` |
| `user_wallet` | `TEXT` | NOT NULL | — |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` |

#### `files`
| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | `UUID` | PRIMARY KEY | `gen_random_uuid()` |
| `project_id` | `UUID` | FK → `projects(id)` ON DELETE CASCADE | — |
| `name` | `TEXT` | NOT NULL | — |
| `content` | `TEXT` | NOT NULL | `''` |
| `language` | `TEXT` | NOT NULL | `'solidity'` |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` |

#### `deployments`
| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | `UUID` | PRIMARY KEY | `gen_random_uuid()` |
| `project_id` | `UUID` | FK → `projects(id)` ON DELETE SET NULL | — |
| `user_wallet` | `TEXT` | NOT NULL | — |
| `chain` | `TEXT` | NOT NULL | — |
| `chain_id` | `INTEGER` | NOT NULL | — |
| `contract_name` | `TEXT` | NOT NULL | — |
| `contract_address` | `TEXT` | NOT NULL | — |
| `tx_hash` | `TEXT` | NOT NULL | — |
| `abi` | `JSONB` | NOT NULL | `'[]'::jsonb` |
| `bytecode` | `TEXT` | NOT NULL | `''` |
| `deployed_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` |

### Indexes

| Index Name | Table | Column(s) |
|-----------|-------|-----------|
| `idx_projects_wallet` | `projects` | `user_wallet` |
| `idx_projects_updated` | `projects` | `updated_at DESC` |
| `idx_files_project` | `files` | `project_id` |
| `idx_deployments_wallet` | `deployments` | `user_wallet` |
| `idx_deployments_chain` | `deployments` | `chain` |
| `idx_deployments_date` | `deployments` | `deployed_at DESC` |

---

## 11. API Endpoints — Full Reference

**Base URL:** `http://localhost:8000`

| Method | Path | Request Body | Response | Description |
|--------|------|-------------|----------|-------------|
| `GET` | `/` | — | `{ name, version, status, docs }` | App info |
| `GET` | `/health` | — | `{ status: "ok" }` | Health check |
| `POST` | `/api/compile/solidity` | `{ source_code, compiler_version?, optimize?, optimize_runs? }` | `{ success, contracts[], errors[], warnings[] }` | Compile Solidity code |
| `GET` | `/api/compile/versions` | — | `{ versions: string[] }` | List available solc versions |
| `POST` | `/api/projects/` | `{ name, chain, language, user_wallet, files[]? }` | `{ success, project_id }` | Create project |
| `GET` | `/api/projects/user/{wallet}` | — | `{ projects[] }` | List user's projects |
| `GET` | `/api/projects/{id}` | — | `{ project, files[] }` | Get project + files |
| `PUT` | `/api/projects/{id}` | `{ name?, files[]? }` | `{ success }` | Update project |
| `DELETE` | `/api/projects/{id}` | — | `{ success }` | Delete project |
| `POST` | `/api/deployments/` | `{ user_wallet, chain, chain_id, contract_name, contract_address, tx_hash, abi[], bytecode }` | `{ success, deployment_id }` | Record deployment |
| `GET` | `/api/deployments/user/{wallet}` | — | `{ deployments[] }` | Deployment history (limit 50) |

**Interactive API Docs:** `http://localhost:8000/docs` (Swagger UI, auto-generated by FastAPI)

---

## 12. Data Models / Schemas (Pydantic)

### Request Models

```python
# Compile
class CompileSolidityRequest(BaseModel):
    source_code: str
    compiler_version: Optional[str] = "0.8.24"
    optimize: Optional[bool] = True
    optimize_runs: Optional[int] = 200

# Projects
class FileItem(BaseModel):
    name: str
    content: str
    language: str  # "solidity" | "rust" | "javascript"

class CreateProjectRequest(BaseModel):
    name: str
    chain: str
    language: str
    user_wallet: str
    files: Optional[List[FileItem]] = None

class UpdateProjectRequest(BaseModel):
    name: Optional[str] = None
    files: Optional[List[FileItem]] = None

# Deployments
class SaveDeploymentRequest(BaseModel):
    project_id: Optional[str] = None
    user_wallet: str
    chain: str
    chain_id: int
    contract_name: str
    contract_address: str
    tx_hash: str
    abi: List[Any]
    bytecode: str
```

### Response Models

```python
class CompileOutput(BaseModel):
    contract_name: str
    abi: List[Any]
    bytecode: str
    deployed_bytecode: str

class CompileResponse(BaseModel):
    success: bool
    contracts: Optional[List[CompileOutput]] = None
    errors: Optional[List[str]] = None
    warnings: Optional[List[str]] = None

class ProjectResponse(BaseModel):
    id: str
    name: str
    chain: str
    language: str
    user_wallet: str
    files: List[FileItem]
    created_at: str
    updated_at: str

class DeploymentResponse(BaseModel):
    id: str
    user_wallet: str
    chain: str
    chain_id: int
    contract_name: str
    contract_address: str
    tx_hash: str
    deployed_at: str
```

---

## 13. Supported Blockchain Networks

| Network | Chain ID | Type | Native Token | RPC URL | Block Explorer | Faucet |
|---------|----------|------|-------------|---------|----------------|--------|
| **Ethereum Sepolia** | `11155111` | EVM | ETH | `https://rpc.sepolia.org` | [sepolia.etherscan.io](https://sepolia.etherscan.io) | [sepoliafaucet.com](https://sepoliafaucet.com) |
| **Monad Testnet** | `10143` | EVM | MON | `https://testnet-rpc.monad.xyz` | [monad-testnet.socialscan.io](https://monad-testnet.socialscan.io) | [faucet.monad.xyz](https://faucet.monad.xyz) |
| **Polygon Amoy** | `80002` | EVM | MATIC | `https://rpc-amoy.polygon.technology` | [amoy.polygonscan.com](https://amoy.polygonscan.com) | [faucet.polygon.technology](https://faucet.polygon.technology) |
| **Arbitrum Sepolia** | `421614` | EVM | ETH | `https://sepolia-rollup.arbitrum.io/rpc` | [sepolia.arbiscan.io](https://sepolia.arbiscan.io) | [faucet.arbitrum.io](https://faucet.arbitrum.io) |
| **Solana Devnet** | `—` | Solana | SOL | `https://api.devnet.solana.com` | [explorer.solana.com/?cluster=devnet](https://explorer.solana.com/?cluster=devnet) | [faucet.solana.com](https://faucet.solana.com) |

> **Note:** Monad Testnet is defined as a **custom chain** in `lib/wagmi-config.ts`. All others use built-in chain definitions from `@reown/appkit/networks`.

---

## 14. Wallet Integration Details

### EVM Chains (MetaMask, WalletConnect, etc.)

| Technology | Role |
|-----------|------|
| **Reown AppKit** (`@reown/appkit`) | Wallet connection modal, account management, theme |
| **wagmi** | React hooks: `useWalletClient()`, `usePublicClient()`, `useAppKitAccount()` |
| **viem** | Low-level EVM client: `deployContract()`, `waitForTransactionReceipt()` |
| **WalletConnect** | Transport protocol for mobile + desktop wallets |
| **MetaMask** | Primary injected wallet (auto-detected by AppKit) |

### AppKit Configuration (in `Providers.tsx`)

```typescript
createAppKit({
  adapters: [wagmiAdapter],
  projectId,                     // WalletConnect Cloud project ID
  networks,                      // [sepolia, monadTestnet, polygonAmoy, arbitrumSepolia]
  metadata: {
    name: 'OmniDeploy IDE',
    description: 'Multi-chain smart contract IDE',
    url: window.location.origin,
    icons: ['https://avatars.githubusercontent.com/u/37784886'],
  },
  features: { analytics: false },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#6366f1',
    '--w3m-border-radius-master': '8px',
  },
});
```

### Solana (Phase 2 — Partial Support)

- Rust/Anchor code editing is supported in the editor
- Browser-based deployment is **not yet implemented**
- Users are guided to use `anchor deploy --provider.cluster devnet` via CLI

---

## 15. Component Dependency Graph

```
app/layout.tsx
├── providers/Providers.tsx
│   └── lib/wagmi-config.ts (adapter, queryClient, projectId, networks)
├── app/globals.css
│
├── app/page.tsx (Landing)
│   └── lib/wagmi-config.ts (CHAIN_CONFIGS)
│
├── app/ide/page.tsx (IDE)
│   ├── components/layout/Navbar.tsx
│   │   ├── components/wallet/WalletButton.tsx (ChainSelector, WalletButton)
│   │   │   └── lib/wagmi-config.ts (CHAIN_CONFIGS, ChainKey)
│   │   └── lib/wagmi-config.ts (CHAIN_CONFIGS, ChainKey)
│   │
│   ├── components/editor/FileExplorer.tsx
│   │   └── components/editor/EditorTabs.tsx (FileTab type)
│   │
│   ├── components/editor/EditorTabs.tsx
│   │
│   ├── components/editor/MonacoEditor.tsx
│   │   └── @monaco-editor/react (dynamic import, SSR disabled)
│   │
│   ├── components/deploy/CompilePanel.tsx
│   │   ├── lib/wagmi-config.ts (CHAIN_CONFIGS, ChainKey)
│   │   └── components/layout/Terminal.tsx (TerminalLine type)
│   │
│   ├── components/deploy/DeployPanel.tsx
│   │   ├── lib/wagmi-config.ts (CHAIN_CONFIGS, ChainKey)
│   │   ├── components/layout/Terminal.tsx (TerminalLine type)
│   │   ├── wagmi (useWalletClient, usePublicClient)
│   │   └── @reown/appkit/react (useAppKitAccount)
│   │
│   └── components/layout/Terminal.tsx
│
└── app/dashboard/page.tsx (Dashboard)
    ├── lib/wagmi-config.ts (CHAIN_CONFIGS)
    └── @reown/appkit/react (useAppKitAccount)
```

---

## 16. Startup Scripts

### `start-all.bat` — Start Both Servers (Windows)
1. Opens new terminal → Backend:
   - Creates venv if not exists
   - Activates venv
   - Installs requirements
   - Runs `uvicorn main:app --reload --port 8000`
2. Waits 3 seconds
3. Opens new terminal → Frontend:
   - Runs `npm run dev` (Next.js on port 3000)

### `start-backend.bat` — Start Backend Only (Windows)
1. Creates venv if not exists
2. Activates venv
3. Installs requirements
4. Runs `uvicorn main:app --reload --port 8000`

### Manual Start (Cross-Platform)

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate    # Linux/Mac
# venv\Scripts\activate     # Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## 17. Integration Guide

### What You Need to Integrate This Project

#### External Services Required

| Service | Purpose | Setup Link |
|---------|---------|-----------|
| **Supabase** | PostgreSQL database (projects, files, deployments) | [supabase.com](https://supabase.com) |
| **WalletConnect Cloud** | Wallet connection project ID | [cloud.walletconnect.com](https://cloud.walletconnect.com) |

#### System Requirements

| Requirement | Minimum Version |
|------------|----------------|
| **Node.js** | 18+ (LTS recommended) |
| **Python** | 3.10+ |
| **npm** | 9+ |

#### Integration Steps

1. **Copy directories:** Copy `frontend/` and `backend/` into your project
2. **Database setup:**
   - Create Supabase project
   - Run `backend/supabase_schema.sql` in SQL Editor
   - Copy URL, anon key, and service role key
3. **Configure environment:**
   - Set all env vars in both `.env` files (see [Section 7](#7-environment-variables))
   - Get WalletConnect project ID from cloud.walletconnect.com
4. **Install dependencies:**
   - Backend: `pip install -r requirements.txt`
   - Frontend: `npm install`
5. **CORS configuration:**
   - Update `FRONTEND_URL` in `backend/.env` to match your app's origin
   - If embedding: update CORS `allow_origins` in `main.py`
6. **Key integration points:**
   - Backend URL: change `NEXT_PUBLIC_BACKEND_URL` to your API host
   - `providers/Providers.tsx`: merge AppKit initialization into your existing provider tree
   - `lib/wagmi-config.ts`: merge chain configs if your app already uses wagmi

#### If Embedding as a Feature in an Existing Next.js App

- **Move pages:** Copy `app/ide/page.tsx` and `app/dashboard/page.tsx` into your existing `app/` directory (adjust paths as needed)
- **Merge providers:** Add `WagmiProvider` and `QueryClientProvider` to your existing provider stack (in `Providers.tsx`)
- **Merge styles:** Copy CSS variables and component styles from `globals.css` into your existing stylesheet (namespace if needed to avoid conflicts)
- **Share components:** All components are self-contained in `components/` — copy the entire directory
- **Merge libs:** Add `wagmi-config.ts` and `supabase.ts` to your `lib/` directory
- **Backend:** Deploy FastAPI as a separate service (or integrate into your existing backend)

#### If Using a Different Frontend Framework (non-Next.js)

- Replace Next.js-specific imports (`next/dynamic`, `next/link`, `next/font/google`)
- Replace `'use client'` directives (Next.js-specific)
- Handle dynamic import of Monaco differently (`React.lazy` or framework-equivalent)
- The backend is framework-agnostic — works with any frontend via REST API

---

## 18. Configuration Files

### `tsconfig.json` — TypeScript Configuration

| Option | Value | Purpose |
|--------|-------|---------|
| `target` | `ES2017` | JavaScript output target |
| `lib` | `dom, dom.iterable, esnext` | Available type libraries |
| `module` | `esnext` | Module system |
| `moduleResolution` | `bundler` | Bundler-style module resolution |
| `jsx` | `react-jsx` | JSX transform mode |
| `strict` | `true` | Strict type checking |
| `noEmit` | `true` | No JS output (handled by Next.js) |
| `incremental` | `true` | Incremental compilation |
| Path alias | `@/*` → `./*` | Import shorthand (e.g., `@/lib/wagmi-config`) |

### `next.config.ts` — Next.js Configuration

```typescript
const nextConfig: NextConfig = {
  turbopack: {},  // Enables Turbopack bundler
};
```

### `postcss.config.mjs` — PostCSS Configuration

```javascript
const config = {
  plugins: {
    "@tailwindcss/postcss": {},  // Tailwind CSS v4 via PostCSS
  },
};
```

### `eslint.config.mjs` — ESLint Flat Configuration

- Uses `eslint-config-next` with Core Web Vitals + TypeScript rules
- Ignores: `.next/`, `out/`, `build/`, `next-env.d.ts`

---

> **This document is the complete technical reference for OmniDeploy IDE. It covers every file, dependency, API endpoint, data model, and configuration needed for integration.**
