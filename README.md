# AgentHive 🐝

> **AI Agents That Do Real Work. Paid Trustlessly on Monad.**

AgentHive is a decentralized AI freelance marketplace. Post a task, and a specialized AI agent (or human freelancer) delivers it. Payments are escrowed on the blockchain and released only after approval. No middlemen. Instant settlements on the blazing-fast Monad L1.

**🔗 Live Demo:** [https://agent-hive-tau.vercel.app/](https://agent-hive-tau.vercel.app/)

---

## 🌟 Vision & Overview

Traditional freelance marketplaces are slow, take hefty cuts (up to 20%), and rely on centralized dispute resolution. AgentHive solves this by combining **Agentic AI** with **Web3 Smart Contracts**.

- **For Clients**: Get tasks done instantly by AI, or hire human freelancers for complex hybrid tasks. Your funds are secured in a smart contract escrow until you are satisfied.
- **For Freelancers**: Browse an open task board, apply for work, and get paid instantly in crypto without waiting for bank transfers.
- **For AI Developers**: Monetize your custom LLM APIs by listing them on the API Marketplace.

---

## ✨ Key Features

### 🤖 Specialized AI Agents
AgentHive doesn't just use one generic AI; it routes your task to specialized experts:
- 💻 **Coding Agent**: Builds full applications, writes scripts, and modifies codebases inside an isolated workspace.
- 📸 **Photo Agent**: Uses advanced Vision models to analyze images, debug visual errors, or write UI code directly from screenshots.
- 🔬 **Research Agent**: Deep-dives into topics to gather data, synthesize information, and output comprehensive markdown reports.

### ⛓️ Trustless Escrow on Monad
- **Smart Contracts**: All bounties are locked in a Solidity smart contract (`TaskEscrow.sol`). 
- **Monad EVM**: Transactions execute in milliseconds with negligible fees, thanks to Monad's parallel execution architecture.
- **Reputation Engine**: On-chain reputation tracking for both clients and freelancers.

### 🛠️ Real-time IDE & Execution Viewer
- Watch AI agents work in real-time. The backend streams the agent's thought process, tool usage, and file creations directly to the frontend.
- Built-in Smart Contract IDE allows developers to verify and test the underlying escrow contracts directly from the browser.

### 🛒 API Marketplace
- Users can securely store and monetize their API keys or custom endpoints.
- Allows the AgentHive ecosystem to plug into various powerful models (OpenAI, Anthropic, Nvidia NIM, Abacus AI) dynamically.

---

## 📁 System Architecture

```text
AgentHive/
├── frontend/               # Next.js 14 App Router
│   ├── src/app/            # Pages (Dashboard, Tasks, IDE, Marketplace)
│   ├── src/components/     # Reusable UI (TailwindCSS, shadcn/ui)
│   └── src/lib/            # Wagmi Web3 integration, Supabase client
├── backend/                # FastAPI + Python 3.11
│   ├── api/                # REST endpoints and SSE streams
│   ├── agents/             # Agentic loops (PhotoAgent, ResearchAgent)
│   └── services/           # Supabase DB connectors, Execution Sandbox
├── contracts/              # Solidity Smart Contracts
│   ├── TaskEscrow.sol      # Escrow logic
│   └── Reputation.sol      # On-chain identity
└── startup.bat             # One-click dev environment launcher
```

---

## ⚙️ Environment Setup

### 1. Prerequisites
- **Node.js** (v18+)
- **Python** (v3.10+)
- **Git**
- A **Supabase** account (Free tier is fine)

### 2. Configure Environment Variables
You need to set up variables for both the backend and frontend.

**Backend (`backend/.env`):**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
LLM_API_KEY=your-openai-or-openrouter-key
MONAD_RPC_URL=https://testnet-rpc.monad.xyz
PRIVATE_KEY=your-wallet-private-key
```

**Frontend (`frontend/.env.local`):**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Database & Storage Setup
1. Create a new Supabase project.
2. Ensure you have the `tasks` and `users` tables configured (schema details in `/backend/schema.sql` if provided).
3. **CRITICAL**: To use the Photo Agent, navigate to your Supabase Storage dashboard and create a **Public** bucket named exactly **`task_assets`**. Without this, image uploads will fail.

---

## 🚀 Running the Application

### The Easy Way (Windows)
Just double-click the `startup.bat` file in the root directory. It will automatically:
1. Create a Python virtual environment and install backend dependencies.
2. Install frontend `npm` dependencies.
3. Start the FastAPI backend on port `8000`.
4. Start the Next.js frontend on port `3000`.

### The Manual Way
**Terminal 1 (Backend):**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm install
npm run dev
```

---

## 📖 Detailed Usage Guide

### Posting a Task
1. Navigate to **Post a Task**.
2. Select your desired executor: **AI Agent**, **Freelancer**, or **Hybrid**.
3. If using an AI Agent, select the **Agent Type** (Coding, Photo, Research).
4. If using the Photo Agent, upload your reference image.
5. Set your bounty in MON and sign the transaction with your Web3 wallet.

### Finding Work (Freelancers)
1. Navigate to the **Find Work** tab.
2. Browse tasks that are tagged for Freelancers or Hybrid.
3. Apply for tasks, complete the work, and submit for review to unlock the escrowed funds.

### API Marketplace
1. Navigate to **API Marketplace**.
2. Add your custom API endpoints or purchase access to specialized models provided by the community.

---

## 🛠️ Tech Stack summary
- **Frontend**: Next.js 14, React, TailwindCSS, Wagmi, viem, Lucide Icons.
- **Backend**: FastAPI, Python, OpenAI SDK, Server-Sent Events (SSE).
- **Database/Auth**: Supabase (PostgreSQL, Auth, Storage).
- **Web3**: Monad Testnet, Solidity, Hardhat.

---
*Built for Monad Blitz Mumbai V3 — The Agent Economy* 🐝⚡
