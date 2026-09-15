# Architecture Decision Record (ADR) – Café/Restaurant Startup Platform  
**Date:** 2026‑09‑15  
**Status:** ✅ *Accepted*  

---

## 1. Context & Problem Statement  

The client wants a **software platform** that will help them launch a café/restaurant on the JSS University Noida campus. The platform must:

1. **Produce & store** all legal documentation required for a food‑service business (company registration, licences, health & safety, lease agreements, employment contracts, etc.).  
2. **Generate & maintain** financial statements (balance sheet, profit & loss, cash‑flow, break‑even analysis, budgeting).  
3. **Support day‑to‑day operations** – menu creation, inventory tracking, purchase orders, and basic point‑of‑sale (POS) data capture.  
4. Be **extensible** for future features (online ordering, loyalty program, analytics).  

The solution should be **maintainable**, **secure**, and **easy to deploy** by a small technical team (or a single full‑stack developer).

---

## 2. Decision  

We will build a **modular micro‑service architecture** hosted on a cloud‑native platform (AWS / Azure / GCP). Each business capability is a separate service exposing a **RESTful JSON API** documented with **OpenAPI 3.0**.  

Key decisions:

| Decision | Rationale |
|----------|-----------|
| **Micro‑service style** (5 core services) | Clear separation of concerns, independent scaling (e.g., inventory may need more compute than legal docs), easier to replace or extend a single domain. |
| **REST/JSON over HTTP** | Universally understood, works with browsers, mobile apps, and simple CLI tools. |
| **OpenAPI 3.0 contracts** | Enables automatic client SDK generation, API‑gateway validation, and documentation (Swagger UI). |
| **Stateless services + JWT auth** | Simplifies horizontal scaling; JWT issued by an Auth Service (future addition). |
| **PostgreSQL per service (or shared DB with schemas)** | Strong ACID guarantees for financial/legal data; easy to migrate to managed RDS/Aurora. |
| **Docker containers + Kubernetes (or managed K8s)** | Consistent dev‑prod parity, automated roll‑outs, health‑checks. |
| **Infrastructure‑as‑Code (Terraform)** | Reproducible environments, version‑controlled infra. |
| **CI/CD pipeline (GitHub Actions / GitLab CI)** | Automated linting, unit tests, OpenAPI validation, container build, and deployment. |
| **File storage on object store (S3 / GCS)** | Large documents (PDFs, scanned licences) stored outside the DB, with signed URLs for access. |
| **Logging & monitoring (ELK / Loki + Grafana)** | Centralised observability for compliance audits. |

---

## 3. System Topology  

```mermaid
graph LR
    subgraph Frontend
        UI[Web UI (React/Next.js)]
    end

    subgraph API_Gateway
        GW[API Gateway (Kong/Traefik)]
    end

    subgraph Services
        LEG[Legal Document Service]
        FIN[Financial Statement Service]
        REG[Business Registration Service]
        MENU[Menu Management Service]
        INV[Inventory Management Service]
    end

    subgraph Shared_Infra
        DB[(PostgreSQL Cluster)]
        OBJ[(Object Store – S3/GCS)]
        AUTH[Auth Service (JWT)]
        MON[Monitoring & Logging]
    end

    UI --> GW
    GW --> LEG
    GW --> FIN
    GW --> REG
    GW --> MENU
    GW --> INV
    GW --> AUTH

    LEG --> DB
    FIN --> DB
    REG --> DB
    MENU --> DB
    INV --> DB

    LEG --> OBJ
    FIN --> OBJ
    REG --> OBJ
    MENU --> OBJ
    INV --> OBJ

    AUTH --> DB
    MON --> DB
    MON --> OBJ
```

*All services are containerised, deployed to a Kubernetes cluster, and exposed through a single API‑gateway that handles routing, rate‑limiting, and TLS termination.*

---

## 4. Component Boundaries & Seams  

| Service | Primary Responsibility | Public API End‑points (Seams) |
|---------|------------------------|------------------------------|
| **Legal Document Service** | CRUD for legal artefacts, versioning, PDF generation | `GET /legal-documents`, `POST /legal-documents`, `GET /legal-documents/{id}`, `PUT /legal-documents/{id}`, `DELETE /legal-documents/{id}` |
| **Financial Statement Service** | Create & store balance‑sheet, P&L, cash‑flow; run simple calculations (break‑even) | `GET /financial-statements`, `POST /financial-statements`, `GET /financial-statements/{id}`, `PUT /financial-statements/{id}` |
| **Business Registration Service** | Capture registration data, generate licence checklists, store lease agreements | `GET /registrations`, `POST /registrations`, `GET /registrations/{id}` |
| **Menu Management Service** | Define menu items, categories, pricing, seasonal offers | `GET /menus`, `POST /menus`, `GET /menus/{id}`, `PUT /menus/{id}`, `DELETE /menus/{id}` |
| **Inventory Management Service** | Track stock levels, create purchase orders, low‑stock alerts | `GET /inventory`, `POST /inventory`, `PUT /inventory/{id}`, `GET /inventory/low-stock` |

All services share a **common error model** and **authentication/authorization** via JWT passed in the `Authorization: Bearer <token>` header.

---

## 5. Directory Structure (Repository Layout)

```
cafe-startup-platform/
├─ .github/                # GitHub Actions CI/CD pipelines
│   └─ workflows/
│       └─ ci.yml
├─ infra/                  # Terraform IaC
│   ├─ main.tf
│   └─ variables.tf
├─ docs/
│   └─ architecture.md     # This ADR + diagrams
├─ services/
│   ├─ legal-documents/
│   │   ├─ src/
│   │   │   ├─ controllers/
│   │   │   ├─ models/
│   │   │   └─ routes/
│   │   ├─ Dockerfile
│   │   └─ openapi.yaml
│   ├─ financial-statements/
│   │   └─ … (same layout)
│   ├─ business-registration/
│   │   └─ …
│   ├─ menu-management/
│   │   └─ …
│   └─ inventory-management/
│       └─ …
├─ gateway/
│   ├─ Dockerfile
│   └─ kong.yaml          # or Traefik config
├─ ui/
│   ├─ package.json
│   └─ src/
│       └─ … (React/Next.js)
└─ README.md
```

*Each service is a **stand‑alone** repo‑folder that can be built, tested, and deployed independently.*

---

## 6. API Contracts (OpenAPI 3.0 snippets)

Below are the **complete OpenAPI definitions** for each service (full files live under `services/<service>/openapi.yaml`). Only the most relevant parts are reproduced here for brevity.

### 6.1 Legal Document Management API  

```yaml
openapi: 3.0.0
info:
  title: Legal Document Management API
  version: 1.0.0
  description: CRUD operations for legal artefacts required to open a café.
servers:
  - url: https://api.cafe.example.com/legal-documents
paths:
  /:
    get:
      summary: List all legal documents
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Array of documents
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/LegalDocument'
    post:
      summary: Create a new legal document
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/NewLegalDocument'
      responses:
        '201':
          description: Document created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/LegalDocument'
  /{id}:
    parameters:
      - name: id
        in: path
        required: true
        schema:
          type: string
    get:
      summary: Retrieve a single document
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Document object
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/LegalDocument'
    put:
      summary: Update a document (metadata only – file upload handled via signed URL)
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdateLegalDocument'
      responses:
        '200':
          description: Updated document
    delete:
      summary: Delete a document
      security:
        - bearerAuth: []
      responses:
        '204':
          description: No Content
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
  schemas:
    LegalDocument:
      type: object
      required: [id, name, type, url, createdAt]
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
        type:
          type: string
          enum: [CompanyRegistration, FoodLicense, HealthPermit, LeaseAgreement, EmploymentContract]
        url:
          type: string
          format: uri
          description: Signed URL to the PDF stored in object storage
        createdAt:
          type: string
          format: date-time
        version:
          type: integer
    NewLegalDocument:
      type: object
      required: [name, type, contentBase64]
      properties:
        name:
          type: string
        type:
          type: string
          enum: [CompanyRegistration, FoodLicense, HealthPermit, LeaseAgreement, EmploymentContract]
        contentBase64:
          type: string
          format: byte
          description: Base64‑encoded PDF (alternative to signed‑URL upload)
    UpdateLegalDocument:
      type: object
      properties:
        name:
          type: string
        version:
          type: integer
```

### 6.2 Financial Statement Management API  

```yaml
openapi: 3.0.0
info:
  title: Financial Statement Management API
  version: 1.0.0
  description: Create, retrieve and compute basic financial reports for the café.
servers:
  - url: https://api.cafe.example.com/financial-statements
paths:
  /:
    get:
      summary: List all statements
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Array of statements
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/FinancialStatement'
    post:
      summary: Create a new statement (balance sheet, P&L, cash‑flow)
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/NewFinancialStatement'
      responses:
        '201':
          description: Statement created
  /{id}:
    parameters:
      - name: id
        in: path
        required: true
        schema:
          type: string
    get:
      summary: Retrieve a specific statement
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Statement object
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/FinancialStatement'
    put:
      summary: Update a statement (e.g., after month‑end close)
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdateFinancialStatement'
      responses:
        '200':
          description: Updated statement
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
  schemas:
    FinancialStatement:
      type: object
      required: [id, period, type, data, createdAt]
      properties:
        id:
          type: string
          format: uuid
        period:
          type: string
          example: "2024-03"
        type:
          type: string
          enum: [BalanceSheet, ProfitAndLoss, CashFlow]
        data:
          type: object
          description: Free‑form key/value pairs (e.g., revenue, expenses)
        createdAt:
          type: string
          format: date-time
    NewFinancialStatement:
      type: object
      required: [period, type, data]
      properties:
        period:
          type: string
        type:
          type: string
          enum: [BalanceSheet, ProfitAndLoss, CashFlow]
        data:
          type: object
    UpdateFinancialStatement:
      type: object
      properties:
        data:
          type: object
```

### 6.3 Business Registration API  

```yaml
openapi: 3.0.0
info:
  title: Business Registration API
  version: 1.0.0
  description: Capture registration details, generate licence check‑lists, store lease agreements.
servers:
  - url: https://api.cafe.example.com/registrations
paths:
  /:
    get:
      summary: List all registrations (normally one per entity)
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Array of registrations
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Registration'
    post:
      summary: Submit a new registration request
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/NewRegistration'
      responses:
        '201':
          description: Registration created
  /{id}:
    parameters:
      - name: id
        in: path
        required: true
        schema:
          type: string
    get:
      summary: Retrieve a registration record
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Registration object
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Registration'
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
  schemas:
    Registration:
      type: object
      required: [id, companyName, address, status, createdAt]
      properties:
        id:
          type: string
          format: uuid
        companyName:
          type: string
        address:
          type: string
        status:
          type: string
          enum: [Draft, Submitted, Approved, Rejected]
        createdAt:
          type: string
          format: date-time
        requiredLicences:
          type: array
          items:
            type: string
            enum: [FoodLicense, HealthPermit, FireSafety, GSTRegistration]
    NewRegistration:
      type: object
      required: [companyName, address]
      properties:
        companyName:
          type: string
        address:
          type: string
        contactPerson:
          type: string
        contactPhone:
          type: string
```

### 6.4 Menu Management API  

```yaml
openapi: 3.0.0
info:
  title: Menu Management API
  version: 1.0.0
  description: CRUD for menu items, categories, and pricing.
servers:
  - url: https://api.cafe.example.com/menus
paths:
  /:
    get:
      summary: List all menu items (optionally filter by category)
      security:
        - bearerAuth: []
      parameters:
        - name: category
          in: query
          schema:
            type: string
      responses:
        '200':
          description: Array of menu items
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/MenuItem'
    post:
      summary: Add a new menu item
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/NewMenuItem'
      responses:
        '201':
          description: Item created
  /{id}:
    parameters:
      - name: id
        in: path
        required: true
        schema:
          type: string
    get:
      summary: Get a single menu item
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Menu item
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/MenuItem'
    put:
      summary: Update a menu item
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdateMenuItem'
      responses:
        '200':
          description: Updated item
    delete:
      summary: Remove a menu item (soft‑delete)
      security:
        - bearerAuth: []
      responses:
        '204':
          description: No Content
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
  schemas:
    MenuItem:
      type: object
      required: [id, name, price, category, active]
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
        description:
          type: string
        price:
          type: number
          format: float
        category:
          type: string
          enum: [Beverage, Snack, Meal, Dessert]
        active:
          type: boolean
        createdAt:
          type: string
          format: date-time
    NewMenuItem:
      type: object
      required: [name, price, category]
      properties:
        name:
          type: string
        description:
          type: string
        price:
          type: number
          format: float
        category:
          type: string
    UpdateMenuItem:
      type: object
      properties:
        name:
          type: string
        description:
          type: string
        price:
          type: number
        category:
          type: string
        active:
          type: boolean
```

### 6.5 Inventory Management API  

```yaml
openapi: 3.0.0
info:
  title: Inventory Management API
  version: 1.0.0
  description: Track stock levels, create purchase orders, and receive low‑stock alerts.
servers:
  - url: https://api.cafe.example.com/inventory
paths:
  /items:
    get:
      summary: List inventory items (filterable)
      security:
        - bearerAuth: []
      parameters:
        - name: lowStock
          in: query
          schema:
            type: boolean
      responses:
        '200':
          description: Array of inventory items
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/InventoryItem'
    post:
      summary: Add a new inventory SKU
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/NewInventoryItem'
      responses:
        '201':
          description: Item created
  /items/{id}:
    parameters:
      - name: id
        in: path
        required: true
        schema:
          type: string
    get:
      summary: Get details for a single SKU
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Inventory item
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/InventoryItem'
    put:
      summary: Update quantity / details
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdateInventoryItem'
      responses:
        '200':
          description: Updated item
  /orders:
    post:
      summary: Create a purchase order (auto‑generated when low‑stock threshold crossed)
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/NewPurchaseOrder'
      responses:
        '201':
          description: PO created
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
  schemas:
    InventoryItem:
      type: object
      required: [id, sku, name, quantity, unit, lowStockThreshold]
      properties:
        id:
          type: string
          format: uuid
        sku:
          type: string
        name:
          type: string
        quantity:
          type: number
        unit:
          type: string
          enum: [kg, litre, piece, pack]
        lowStockThreshold:
          type: number
        lastUpdated:
          type: string
          format: date-time
    NewInventoryItem:
      type: object
      required: [sku, name, quantity, unit, lowStockThreshold]
      properties:
        sku:
          type: string
        name:
          type: string
        quantity:
          type: number
        unit:
          type: string
        lowStockThreshold:
          type: number
    UpdateInventoryItem:
      type: object
      properties:
        quantity:
          type: number
        lowStockThreshold:
          type: number
    NewPurchaseOrder:
      type: object
      required: [items, supplier]
      properties:
        supplier:
          type: string
        items:
          type: array
          items:
            type: object
            required: [sku, quantity]
            properties:
              sku:
                type: string
              quantity:
                type: number
```

---

## 7. Rationale & Trade‑offs  

| Aspect | Chosen Approach | Alternatives Considered | Why the chosen approach wins |
|--------|----------------|------------------------|------------------------------|
| **Service granularity** | 5 bounded‑context services | One monolith; 10+ micro‑services | 5 services give clear domain separation while keeping ops overhead low. |
| **Communication** | Synchronous REST/JSON | gRPC, Message Queues (Kafka) | REST is sufficient for CRUD‑heavy workloads; adds no extra client‑side complexity. |
| **Data storage** | PostgreSQL per service (or shared DB with schemas) + S3 for binaries | NoSQL (MongoDB) | Relational DB gives ACID guarantees needed for financial/legal data. |
| **Auth** | JWT issued by a future Auth Service (OAuth2) | Session cookies, API keys | JWT is stateless, works across services, easy to integrate with API‑gateway. |
| **Deployment** | Docker + Kubernetes (managed) | Serverless (AWS Lambda) | K8s gives fine‑grained resource control and is a good learning platform for the client’s future scaling. |
| **CI/CD** | GitHub Actions + Docker BuildKit | Jenkins, GitLab CI | GitHub Actions is native to the repo host, low‑maintenance, and supports secret management. |
| **Observability** | Loki + Grafana + Prometheus | Cloud‑provider proprietary logs | Open‑source stack is vendor‑agnostic and cheaper for a small startup. |

---

## 8. Consequences  

* **Positive**  
  * Independent scaling – inventory may need more CPU than legal docs.  
  * Teams (or a single developer) can work on one service without affecting others.  
  * Clear API contracts enable future mobile/web clients or third‑party integrations (e.g., accounting software).  

* **Negative / Mitigations**  
  * **Operational overhead** – Kubernetes introduces complexity; mitigated by using a managed service (EKS/AKS/GKE).  
  * **Network latency** – multiple HTTP hops; mitigated by colocating services in the same VPC and using HTTP/2 keep‑alive.  
  * **Data consistency** – cross‑service transactions are not needed (each domain owns its data). If a future requirement emerges (e.g., a transaction that updates inventory *and* financials atomically), we can introduce a saga pattern.  

---

## 9. Next Steps  

1. **Bootstrap the repo** with the directory layout above.  
2. **Create Terraform modules** for the PostgreSQL cluster, S3 bucket, and EKS cluster.  
3. **Implement the Legal Document Service** (fastest MVP – most paperwork).  
4. **Add CI pipeline** that runs `openapi-generator` to produce a TypeScript client for the UI.  
5. **Iterate** through the remaining services, adding unit/integration tests and Swagger UI for each.  
6. **Build the React/Next.js UI** that consumes the generated client libraries.  

---

## 10. References  

* **Microservice Patterns** – Chris Richardson, 2022.  
* **OpenAPI Specification v3.0.3** – https://spec.openapis.org/oas/v3.0.3  
* **12‑Factor App** – https://12factor.net/  
* **AWS Well‑Architected Framework** – Security, Reliability, Performance, Cost‑Optimization.  

---  

*Prepared by:* **Principal Software Architect**  
*Date:* 2026‑09‑15  

---  