# Polyman: Autonomous Multi-Agent Engineering Platform

Polyman is an enterprise-grade autonomous multi-agent software engineering platform. Given a high-level task prompt, Polyman’s **Chief Orchestrator** decomposes mission requirements into a dynamic **Directed Acyclic Graph (DAG)** and executes specialized subagents directly against your local workspace repositories with real-time streaming oversight.

---

## 🌟 Core Subagent Roster

| Subagent | Role | Focus Areas | Key Deliverables |
| :--- | :--- | :--- | :--- |
| 🧠 **Orchestrator** | Chief Planner | Requirement decomposition, DAG creation, and mission oversight | Execution DAG & status pipeline |
| 📐 **Architect** | System Architect | Topology design, component boundaries, and ADRs | `docs/architecture/ADR_system_design.md` |
| 💻 **SDE** | Software Engineer | Production code generation, bug fixing, test scaffolding | Direct source files (`src/`, `tests/`) |
| ⚖️ **Lawyer** | Legal Counsel | OSS licensing risks (copyleft/AGPL), Terms of Service, GDPR | `LICENSE`, `docs/legal/legal_compliance_audit.md` |
| 🛡️ **Auditor** | Security Auditor | OWASP Top 10 sweep, secret detection, quality gating | `docs/audit/security_audit_report.md` |
| 📊 **Accountant** | Financial Accountant | Cloud FinOps (AWS/GCP/Vercel), API token budget, OpEx | `docs/financial/cost_and_budget_model.md` |

Plus an interactive **Custom Agent Builder UI** to provision bespoke domain agents (DevOps, QA, Marketing, Tax, etc.) on demand.

---

## 🚀 Quick Start (1-Command Launch)

Start both the FastAPI backend server and the Vite React frontend with a single command:

```bash
python run.py
```

- **Frontend Dashboard:** [http://localhost:5173](http://localhost:5173)
- **Backend API Docs:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Health Check:** [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

---

## 🎨 Enterprise Dual Mode UI

- **Light Mode & Dark Mode:** Toggleable corporate slate and high-contrast dark themes.
- **Interactive DAG Canvas:** Live node state badges (Pending, Running with animated pulse, Completed, Failed), dependency chains, and outputs.
- **Live Terminal Stream:** Real-time event log filtering agent thoughts, tool actions, and deliverables.
- **Workspace & Code Explorer:** Integrated file tree, source code viewer, and live Git working tree diff inspector.
- **Deliverables & Reports Viewer:** Markdown reader for legal compliance audits, security reports, FinOps models, and architectural ADRs.

---

## 🔑 Multi-Provider BYOK (Bring Your Own Key)

Polyman supports:
- **Google Gemini** (Gemini 2.0 Flash / Pro)
- **Anthropic Claude** (Claude 3.7 Sonnet / 3.5 Haiku)
- **OpenAI** (GPT-4o, GPT-4o-mini)
- **Local Ollama** (`http://localhost:11434`)

> **Offline Domain Generator Included:** If you do not have API keys configured, Polyman includes an intelligent domain fallback generator that synthesizes realistic, context-aware code, ADRs, compliance audits, and financial models for immediate zero-cost testing out of the box!

---

## 📂 Project Structure

```text
polyman/
├── backend/
│   ├── app/
│   │   ├── agents/          # Specialized subagent implementations
│   │   ├── api/             # REST routes & WebSocket event stream
│   │   ├── core/            # Config, SQLite DB, and EventManager
│   │   ├── engine/          # LLM Gateway, DAG Executor, Orchestrator
│   │   ├── models/          # Pydantic & SQLAlchemy data schemas
│   │   └── tools/           # Filesystem, shell, git, and doc tools
│   ├── tests/               # Pytest suite
│   ├── main.py              # FastAPI server entrypoint
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/      # DAG visualizer, live terminal, workspace explorer
│   │   ├── App.tsx          # Master dashboard
│   │   └── index.css        # Enterprise Dual Mode CSS tokens
│   └── package.json
├── run.py                   # Unified launcher
└── README.md
```

---

## 🧪 Running Automated Tests

Run the backend unit test suite:

```bash
cd backend
python -m pytest tests/
```

Run the frontend type check & build:

```bash
cd frontend
npm run build
```

---

## 📄 License

MIT License. Copyright (c) 2026 Polyman Contributors.
