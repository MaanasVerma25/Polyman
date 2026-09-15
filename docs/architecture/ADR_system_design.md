# Architecture Decision Record (ADR) – Secure Microservice API  
**Title:** Secure Microservice API with JWT Authentication, Budget‑Estimation, and MIT‑License Compliance  
**Status:** ✅ Accepted  
**Date:** 2026‑09‑15  
**Authors:** Principal Software Architect (ChatGPT)  

---

## 1. Context & Problem Statement  

The product team requires a **public‑facing API** that:

1. Exposes a **budget‑estimation** capability.  
2. Enforces **strong security** using **JWT‑based authentication & authorization**.  
3. Guarantees **MIT‑license compliance** for all source code and generated artifacts.  
4. Is **scalable**, **maintainable**, and **deployable** as independent micro‑services.  

The solution must be language‑agnostic, cloud‑native, and support automated testing, CI/CD, and observability.

---

## 2. Decision  

Adopt a **microservice architecture** built around four logical services, each running in its own container and communicating over **HTTPS/REST** (with optional gRPC for internal high‑throughput calls). An **API‑Gateway** sits at the edge to handle routing, request‑level security, rate‑limiting, and API‑versioning.  

All services will be **stateless** (except the Budget Service which may use a read‑only data store) and will store configuration in **environment variables** or a **central config service** (e.g., Consul, Spring Cloud Config).  

The stack will be **Node.js (TypeScript) + Express** for the gateway, **Go** for the Authentication Service (leveraging its strong crypto libraries), **Python (FastAPI)** for the Budget Estimation Service (to reuse scientific libraries), and **Rust** for the License‑Compliance Service (for safety and performance).  

All services will be containerised with **Docker**, orchestrated by **Kubernetes**, and deployed via **GitHub Actions** pipelines.  

---

## 3. System Topology  

```
+-------------------+          +-------------------+          +-------------------+
|   API Gateway     | <------> | Authentication    | <------> |   Identity Store  |
| (NGINX + Node.js) |  HTTPS   | Service (Go)      |  JWT     | (PostgreSQL)      |
+-------------------+          +-------------------+          +-------------------+
        |   ^                         |   ^                         |
        |   |                         |   |                         |
        |   |                         |   |                         |
        v   |                         v   |                         v
+-------------------+          +-------------------+          +-------------------+
| Budget Estimation | <------> | License Compliance| <------> |  Artifact Repo   |
| Service (Python) |  HTTPS   | Service (Rust)    |  HTTPS   | (GitHub)          |
+-------------------+          +-------------------+          +-------------------+

Legend:
 • All inter‑service traffic uses mTLS (mutual TLS) for confidentiality & integrity.
 • API‑Gateway also performs request‑level rate‑limiting, logging, and tracing.
```

### External Actors  

| Actor                | Interaction                                                                 |
|----------------------|-----------------------------------------------------------------------------|
| **Client Application** | Calls the API‑Gateway (`/v1/...`) with a JWT in the `Authorization` header. |
| **CI/CD System**       | Pushes Docker images, runs integration tests, and updates Helm charts.      |
| **Ops / SRE**          | Monitors metrics (Prometheus), logs (ELK), and traces (Jaeger).             |

---

## 4. Component Seams (Interfaces)  

| From → To                     | Protocol | Endpoint (example)                | Payload / Contract                              |
|-------------------------------|----------|-----------------------------------|-------------------------------------------------|
| **Gateway → Auth Service**    | HTTPS    | `POST /auth/login`                | `{username, password}` → `{access_token, exp}` |
| **Gateway → Auth Service**    | HTTPS    | `GET /auth/validate` (internal)  | `Authorization: Bearer <jwt>` → `{sub, roles}` |
| **Gateway → Budget Service**  | HTTPS    | `POST /budget/estimate`           | `{projectId, parameters}` → `{estimate}`      |
| **Gateway → License Service** | HTTPS    | `POST /license/check`             | `{repoUrl, commitSha}` → `{compliant, details}`|
| **Auth Service → Identity DB**| SQL (TLS)| `SELECT * FROM users WHERE ...`   | N/A (internal)                                 |
| **Budget Service → Data Store**| HTTPS   | `GET /data/project/{id}`          | N/A (read‑only)                                 |
| **License Service → Artifact Repo**| HTTPS| `GET /repos/{owner}/{repo}/contents/LICENSE` | N/A (read‑only)                                 |

All seams are versioned (`/v1/…`) and documented in an **OpenAPI 3.1** spec stored under `docs/openapi/`.

---

## 5. Directory Structure  

```
/project-root
│
├─ LICENSE                     # MIT license text
├─ NOTICE                      # Attribution notice (optional)
├─ README.md
├─ docs/
│   └─ openapi/
│        ├─ gateway.yaml
│        ├─ auth.yaml
│        ├─ budget.yaml
│        └─ license.yaml
│
├─ helm/
│   └─ chart/                  # Helm chart for full stack deployment
│
├─ .github/
│   └─ workflows/
│        └─ ci-cd.yml
│
├─ api-gateway/
│   ├─ Dockerfile
│   ├─ src/
│   │   ├─ index.ts
│   │   ├─ routes/
│   │   │   ├─ auth.ts
│   │   │   ├─ budget.ts
│   │   │   └─ license.ts
│   │   └─ middleware/
│   │        ├─ jwt.ts
│   │        └─ rateLimiter.ts
│   └─ tsconfig.json
│
├─ authentication-service/
│   ├─ Dockerfile
│   ├─ cmd/
│   │   └─ server/main.go
│   ├─ internal/
│   │   ├─ auth/
│   │   ├─ jwt/
│   │   └─ storage/
│   └─ go.mod
│
├─ budget-estimation-service/
│   ├─ Dockerfile
│   ├─ app/
│   │   ├─ main.py
│   │   ├─ routers/
│   │   │   └─ budget.py
│   │   └─ models/
│   │        └─ estimation.py
│   ├─ requirements.txt
│   └─ pyproject.toml
│
└─ license-compliance-service/
    ├─ Dockerfile
    ├─ src/
    │   ├─ main.rs
    │   ├─ handlers/
    │   │   └─ check.rs
    │   └─ lib/
    │        └─ mit.rs
    └─ Cargo.toml
```

*Each microservice is a **first‑class citizen** with its own CI pipeline, Dockerfile, and Helm sub‑chart.*  

---

## 6. API Contracts (OpenAPI snippets)

Below are minimal OpenAPI 3.1 excerpts for each public endpoint. Full specs live in `docs/openapi/*.yaml`.

### 6.1 API‑Gateway (`gateway.yaml`)

```yaml
openapi: 3.1.0
info:
  title: Secure Microservice API – Gateway
  version: 1.0.0
servers:
  - url: https://api.example.com/v1
paths:
  /auth/login:
    post:
      summary: Obtain JWT token
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/LoginRequest'
      responses:
        '200':
          description: JWT token
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/LoginResponse'
        '401':
          description: Invalid credentials
  /budget/estimate:
    post:
      security:
        - bearerAuth: []
      summary: Estimate project budget
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/BudgetRequest'
      responses:
        '200':
          description: Budget estimate
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/BudgetResponse'
        '401':
          description: Unauthorized
  /license/check:
    post:
      security:
        - bearerAuth: []
      summary: Verify MIT‑license compliance
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/LicenseCheckRequest'
      responses:
        '200':
          description: Compliance result
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/LicenseCheckResponse'
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
  schemas:
    LoginRequest:
      type: object
      required: [username, password]
      properties:
        username: {type: string}
        password: {type: string}
    LoginResponse:
      type: object
      properties:
        access_token: {type: string}
        expires_in: {type: integer}
    BudgetRequest:
      type: object
      required: [projectId, parameters]
      properties:
        projectId: {type: string}
        parameters:
          type: object
          additionalProperties: true
    BudgetResponse:
      type: object
      properties:
        estimate: {type: number, format: double}
        currency: {type: string, example: USD}
    LicenseCheckRequest:
      type: object
      required: [repoUrl, commitSha]
      properties:
        repoUrl: {type: string, format: uri}
        commitSha: {type: string, pattern: '^[a-f0-9]{40}$'}
    LicenseCheckResponse:
      type: object
      properties:
        compliant: {type: boolean}
        details: {type: string}
```

### 6.2 Authentication Service (`auth.yaml`)

```yaml
openapi: 3.1.0
info:
  title: Authentication Service
  version: 1.0.0
paths:
  /auth/login:
    post:
      summary: Validate credentials and issue JWT
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/LoginRequest'
      responses:
        '200':
          description: JWT token
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/LoginResponse'
        '401':
          description: Invalid credentials
components:
  schemas:
    LoginRequest:
      type: object
      required: [username, password]
      properties:
        username: {type: string}
        password: {type: string}
    LoginResponse:
      type: object
      properties:
        access_token: {type: string}
        expires_in: {type: integer}
```

### 6.3 Budget Estimation Service (`budget.yaml`)

```yaml
openapi: 3.1.0
info:
  title: Budget Estimation Service
  version: 1.0.0
paths:
  /budget/estimate:
    post:
      security:
        - bearerAuth: []
      summary: Compute a cost estimate
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/BudgetRequest'
      responses:
        '200':
          description: Estimate result
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/BudgetResponse'
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
  schemas:
    BudgetRequest:
      type: object
      required: [projectId, parameters]
      properties:
        projectId: {type: string}
        parameters:
          type: object
          additionalProperties: true
    BudgetResponse:
      type: object
      properties:
        estimate: {type: number, format: double}
        currency: {type: string}
```

### 6.4 License‑Compliance Service (`license.yaml`)

```yaml
openapi: 3.1.0
info:
  title: License Compliance Service
  version: 1.0.0
paths:
  /license/check:
    post:
      security:
        - bearerAuth: []
      summary: Verify that a repo’s code is MIT‑licensed
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/LicenseCheckRequest'
      responses:
        '200':
          description: Compliance result
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/LicenseCheckResponse'
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
  schemas:
    LicenseCheckRequest:
      type: object
      required: [repoUrl, commitSha]
      properties:
        repoUrl: {type: string, format: uri}
        commitSha: {type: string}
    LicenseCheckResponse:
      type: object
      properties:
        compliant: {type: boolean}
        details: {type: string}
```

---

## 7. Non‑Functional Requirements (NFRs) Addressed  

| NFR                     | How it is satisfied                                                            |
|-------------------------|--------------------------------------------------------------------------------|
| **Security**            | - JWT signed with RS256 (asymmetric keys) <br>- mTLS between services <br>- Rate limiting & OWASP‑top‑10 mitigations in gateway |
| **Scalability**         | Stateless services → horizontal scaling via Kubernetes Deployments & HPA |
| **Observability**       | Prometheus metrics (`/metrics`), OpenTelemetry tracing, centralized logging (EFK) |
| **Reliability**         | Liveness/readiness probes, circuit‑breaker (Resilience4j) in gateway, graceful shutdown |
| **Maintainability**     | Separate repos per service, clear module boundaries, OpenAPI contracts, CI linting |
| **Portability**         | Docker + Helm → deployable on any K8s‑compatible cloud (EKS, GKE, AKS, on‑prem) |
| **Compliance**          | MIT license file at repo root, SPDX identifier in `package.json`, `Cargo.toml`, `go.mod`, `pyproject.toml` |
| **Performance**         | Go & Rust services for crypto‑heavy paths; FastAPI for numeric estimation; async I/O in gateway |

---

## 8. Decision Rationale  

| Option | Pros | Cons | Reason for Rejection |
|--------|------|------|----------------------|
| **Monolith (single codebase)** | Simpler dev setup | Hard to scale, single point of failure, difficult to enforce per‑service security policies | Violates scalability & isolation goals |
| **All services in same language (e.g., Node.js)** | Uniform tooling | Misses opportunity to use best‑fit languages for crypto (Go) and scientific computing (Python) | Reduces productivity for domain‑specific tasks |
| **gRPC for all inter‑service calls** | Efficient binary protocol | Increases operational complexity, harder for external clients to test via curl/Postman | REST/HTTPS already sufficient; gRPC optional for future high‑throughput paths |
| **Serverless (AWS Lambda)** | Zero‑ops infra | Cold‑start latency for JWT verification, limited control over mTLS, harder to enforce MIT‑license compliance across layers | Not aligned with strict security & observability requirements |

**Chosen approach** (microservices with REST/HTTPS) best balances **security, performance, developer productivity, and operational simplicity** while meeting all functional and non‑functional requirements.

---

## 9. Implementation Roadmap  

| Sprint | Deliverable |
|--------|-------------|
| **Sprint 1** | Scaffold repo, create Dockerfiles, CI pipelines, and basic Helm chart. |
| **Sprint 2** | Implement Authentication Service (login, JWT issuance, key rotation). |
| **Sprint 3** | Build API‑Gateway with JWT validation, rate‑limiting, and routing. |
| **Sprint 4** | Develop Budget Estimation Service (simple linear model). |
| **Sprint 5** | Implement License‑Compliance Service (fetch LICENSE file, verify MIT SPDX identifier). |
| **Sprint 6** | Add observability (Prometheus exporters, OpenTelemetry tracing). |
| **Sprint 7** | End‑to‑end security hardening (mTLS, secret management via Vault). |
| **Sprint 8** | Load‑testing, performance tuning, documentation finalisation, release. |

---

## 10. MIT License Compliance Checklist  

- **Root `LICENSE` file** containing the full MIT text.  
- **`NOTICE` file** (optional) for attribution of third‑party libraries.  
- Each language package manifest includes the SPDX identifier:  

  ```json
  // package.json
  "license": "MIT"
  ```

  ```toml
  # Cargo.toml
  license = "MIT"
  ```

  ```go
  // go.mod
  // SPDX-License-Identifier: MIT
  ```

- CI step verifies that every source file contains the SPDX header (via `reuse lint`).  

---

## 11. Open Issues / Future Considerations  

1. **API versioning strategy** – currently `v1` in path; may evolve to header‑based versioning.  
2. **Refresh‑token flow** – not in scope now; could be added later.  
3. **Multi‑tenant isolation** – future requirement may need per‑tenant databases or namespaces.  
4. **GraphQL façade** – optional for clients needing flexible queries.  

---

## 12. References  

- **RFC 7519** – JSON Web Token (JWT)  
- **OpenAPI Specification 3.1** – https://spec.openapis.org/oas/v3.1.0  
- **MIT License** – https://opensource.org/licenses/MIT  
- **OWASP API Security Top 10** – https://owasp.org/www-project-api-security/  

---  

*End of Architecture Decision Record.*