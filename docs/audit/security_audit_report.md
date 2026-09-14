# Architecture Decision Record (ADR): Polyman Project Blueprint

## Executive Summary
This document establishes the structural topology, API contracts, and component seams for:
> **Task Scope:** Conduct an intensive Security Audit and Quality Review for:
TASK: Audit this workspace for OWASP Top 10 vulnerabilities and dependency licensing risks
EXISTING FILES: .agents, backend, docs, frontend, src, LICENSE, README.md, run.py, skills-lock.json, .agents/skills, .agents/skills/ask-matt, .agents/skills/banner-design, .agents/skills/brand, .agents/skills/claude-handoff, .agents/skills/code-review

Evaluate OWASP Top 10 risks, check for secret leakage, SQL/Command injection vectors, and assign a security grade.

## 1. System Topology
- **Pattern:** Layered Microservice / Modular Monolith
- **Communication:** Async Event-Driven / REST
- **Persistence Layer:** ACID SQLite / PostgreSQL compatible schema
- **Runtime Target:** Containerized Node.js / Python Fast Execution

## 2. Component Boundaries
```mermaid
graph LR
    Client[Client Interface] --> Gateway[API Gateway / Router]
    Gateway --> CoreService[Business Logic Domain]
    CoreService --> DataStore[(Persistence Store)]
    CoreService --> AuditBus[Audit & Telemetry Stream]
```

## 3. Directory Layout
```text
src/
├── core/
│   ├── config.ts / config.py
│   └── errors.ts
├── modules/
│   ├── domain/
│   └── handlers/
└── tests/
```

## 4. Contract Specifications
- Strict type assertions with zero `any` allowance.
- Standard JSON envelope with error tracking headers.
