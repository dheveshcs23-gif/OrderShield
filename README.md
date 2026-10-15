# OrderShield — Secure E-Commerce Platform with Home Address Protection

[![Spring Boot 3.3.4](https://img.shields.io/badge/Backend-Spring%20Boot%203.3.4-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![React 19 & Vite](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite%20%2B%20Tailwind%20CSS-blue.svg)](https://vitejs.dev/)
[![Security](https://img.shields.io/badge/Security-Address%20Authorization%20Engine-teal.svg)](#ordershield-security-architecture)
[![JUnit 5](https://img.shields.io/badge/Tests-15%2F15%20Passing-success.svg)](#automated-testing-suite)

**OrderShield** is an independent, production-grade e-commerce web application engineered to solve a pervasive vulnerability in modern retail delivery: **unauthorized delivery exploitation to registered residential addresses**.

Unlike generic e-commerce mockups, OrderShield implements an end-to-end security engine spanning database constraints, cryptographic address normalization, role-based authorization workflows, transactional inventory reservation, and dispatch blocking.

---

## Table of Contents
1. [Core Security Concept](#1-core-security-concept)
2. [OrderShield Rule Engine & Workflow](#2-ordershield-rule-engine--workflow)
3. [Architecture & Technology Stack](#3-architecture--technology-stack)
4. [Data Model & Database Schema](#4-data-model--database-schema)
5. [Address Normalization Engine](#5-address-normalization-engine)
6. [Demo Personas & Test Credentials](#6-demo-personas--test-credentials)
7. [Running the Application on Windows](#7-running-the-application-on-windows)
8. [Automated Testing Suite (15/15 Passed)](#8-automated-testing-suite)
9. [API Endpoint Reference](#9-api-endpoint-reference)
10. [Teaching Notes: Architecture Decisions](#10-teaching-notes-architecture-decisions)

---

## 1. Core Security Concept

In traditional e-commerce platforms, anyone who knows your home address can place an order delivered to your doorstep. This enables:
- Harassment or unwanted parcels sent to your home.
- Fraudsters ordering stolen or illicit items using another resident's address as a collection point.
- Porch piracy exploitation where orders are shipped to a victim's address and intercepted by third parties.

**OrderShield introduces home address ownership verification**:
- A verified homeowner or primary tenant registers and locks their residential address.
- The owner can invite and manage explicitly trusted household members (spouses, roommates, family).
- When anyone else attempts to ship an order to that protected address, **OrderShield halts the dispatch pipeline**, records a pending authorization request, and alerts the owner in their private dashboard.
- **Dispatch is strictly locked** until the owner signs off. If the owner rejects, the order is cancelled, inventory is restored, and the dispatch flag is permanently sealed.

---

## 2. OrderShield Rule Engine & Workflow

```mermaid
flowchart TD
    A[Customer Initiates Checkout] --> B[Validate Cart & Shipping Address]
    B --> C[Compute Normalized Hash: street + unit + city + postalCode]
    C --> D{Does address match an active ProtectedAddress?}
    
    D -- No --> E[Normal Order Processing]
    E --> F[Status: PROCESSING | Dispatch: ALLOWED]
    
    D -- Yes --> G{Is authenticated user the Verified Owner?}
    G -- Yes --> H[Verified Owner Order: No Alert Needed]
    H --> F
    
    G -- No --> I{Is user an ACTIVE Trusted Household Member?}
    I -- Yes --> J[Trusted Household Order: No Alert Needed]
    J --> F
    
    I -- No --> K[TRIGGER ORDERSHIELD SECURITY ENGINE]
    K --> L[Status: PENDING_SECURITY_AUTHORIZATION]
    K --> M[Set is_dispatch_blocked = TRUE]
    K --> N[Create AuthorizationRequest for Owner]
    K --> O[Dispatch In-App Security Notification to Owner]
    
    L --> P{Owner Decision in Security Dashboard}
    P -- Approve --> Q[Status: PROCESSING | Unblock Dispatch]
    P -- Reject --> R[Status: CANCELLED | Permanent Dispatch Lock | Restock Inventory]
    P -- No Response --> S[Dispatch Remains Blocked Indefinitely]
```

### Critical Security Invariants:
1. **Never Assume Consent**: Lack of response or expired time NEVER converts to approval.
2. **Never Stigmatize**: Untrusted accounts are not labeled as fraudsters; they are treated as requiring household confirmation.
3. **Information Minimization**: The owner sees only necessary order details (name of purchaser, date, order number) without leaking payment details or sensitive notes.
4. **Anti-Tamper Dispatch**: Even if an admin clicks "Dispatch", the backend rejects the operation with `409 Conflict` if `is_dispatch_blocked == true`.

---

## 3. Architecture & Technology Stack

### Frontend (`/frontend`)
- **Framework**: React 19 + TypeScript + Vite.
- **Styling**: Tailwind CSS v4 featuring deep navy typography (`#0f172a`), clean slate surfaces (`#f8fafc`), and OrderShield emerald/teal security accents (`#0d9488`).
- **Icons**: Lucide React (`Shield`, `ShieldCheck`, `ShieldAlert`, `Lock`, `Package`, `Users`, `Bell`).
- **Interactive Persona Bar**: Sticky demo switcher allowing 1-click toggling between **Alice (Owner)**, **Bob (Household Member)**, **Mallory (Stranger)**, and **Admin**.
- **State & Storage**: Resilient dual-mode client that communicates with the Spring Boot backend (`/api`) and maintains synchronized local state with offline-safe fallback.

### Backend (`/backend`)
- **Runtime**: Java 17 LTS + Spring Boot 3.3.4.
- **Security**: Spring Security with stateless JWT (`io.jsonwebtoken:jjwt:0.12.6`), BCrypt password hashing, and role-based route guards (`ROLE_CUSTOMER`, `ROLE_ADMIN`).
- **Data Persistence**: Spring Data JPA + Hibernate ORM.
- **Database**: PostgreSQL (Production) with zero-configuration in-memory H2 PostgreSQL-compatible mode (`dev` profile).
- **Schema Management**: Flyway database migrations (`V1__init_schema.sql`, `V2__seed_initial_data.sql`).

---

## 4. Data Model & Database Schema

The database model is normalized across 11 tables with foreign keys, uniqueness constraints, and indexing:

| Table | Description | Key Security Fields |
|---|---|---|
| `users` | Accounts and credentials | `password_hash` (BCrypt), `role` (`ROLE_CUSTOMER`, `ROLE_ADMIN`) |
| `addresses` | Standard customer delivery addresses | `street_line`, `city`, `postal_code` |
| `protected_addresses` | Registered & locked residential addresses | `owner_id`, `normalized_hash`, `verification_status`, `is_active` |
| `trusted_household_members` | Explicitly authorized residents | `protected_address_id`, `member_email`, `status` (`ACTIVE`, `REVOKED`) |
| `products` | E-commerce catalogue items | `sku`, `price`, `stock_quantity` |
| `categories` | Product grouping taxonomy | `slug`, `name` |
| `orders` | Transactional customer purchases | `status`, `is_dispatch_blocked`, `authorization_request_id` |
| `order_items` | Products and quantities in an order | `unit_price`, `quantity`, `subtotal` |
| `authorization_requests` | Security approval tickets for address owners | `protected_address_id`, `status` (`PENDING`, `APPROVED`, `REJECTED`) |
| `notifications` | In-app alerts delivered to owners | `type` (`SECURITY_AUTHORIZATION_REQUEST`), `is_read` |
| `audit_logs` | Immutable audit trail of all security decisions | `actor_email`, `action`, `resource_type`, `resource_id` |

---

## 5. Address Normalization Engine

Attackers frequently attempt to bypass address matching by inserting abbreviations or punctuation:
- Target: `742 Evergreen Terrace, Apt 4B, Springfield, OR 97477`
- Evasion attempt: `742 Evergreen Ter., #4b, springfield, or 97477`

### Normalization Logic (`AddressNormalizationService.java`):
1. **Lowercase & Trim**: Strip leading/trailing whitespaces, convert all text to lower case.
2. **Standardize Street Suffixes**:
   - `\b(street|st\.)\b` $\rightarrow$ `st`
   - `\b(terrace|ter\.)\b` $\rightarrow$ `terrace`
   - `\b(avenue|ave\.)\b` $\rightarrow$ `ave`
   - `\b(road|rd\.)\b` $\rightarrow$ `rd`
   - `\b(boulevard|blvd\.)\b` $\rightarrow$ `blvd`
   - `\b(apartment|apt\.|suite|ste\.)\b` $\rightarrow$ `apt`
3. **Punctuation & Space Stripping**: Remove `#`, `.`, `-`, commas, and whitespace.
4. **Deterministic Token Hash**: Concatenates `${street}|${unit}|${city}|${postalCode}`.

Result: Both `742 Evergreen Terrace, Apt 4B` and `742 Evergreen Ter, Apt 4-B` produce identical hash `742evergreenterrace|apt4b|springfield|97477`.

---

## 6. Demo Personas & Test Credentials

All demo accounts share the password: `password123`

| Persona | Email | Role in OrderShield | Expected Behavior at `742 Evergreen Terrace` |
|---|---|---|---|
| **Alice Walker** | `alice@shield.com` | Verified Address Owner | Orders pass immediately. Receives alerts when strangers order to her address. Has dashboard to approve/reject requests and manage household. |
| **Bob Walker** | `bob@shield.com` | Trusted Household Member | Orders pass immediately without generating alerts. Can be revoked by Alice at any time. |
| **Mallory Smith** | `mallory@shield.com` | Untrusted Customer / Stranger | Order triggers OrderShield security lock. Status becomes `PENDING_SECURITY_AUTHORIZATION`. Dispatch blocked. |
| **CSO Admin** | `admin@ordershield.com` | Store Administrator | Access to `/admin`. Controls product inventory, reviews audit logs, and operates the dispatch queue. Cannot dispatch blocked orders. |

---

## 7. Running the Application on Windows

### Prerequisites
- **Node.js**: v18+ (tested on Node v24).
- **Java Development Kit**: JDK 17 LTS (`C:\Program Files\Java\jdk-17`).
- **Maven**: 3.8+ (included in PATH).
- **PostgreSQL**: (Optional; application runs with zero configuration on H2 PostgreSQL mode by default).

### 1. Start the Frontend Server (Port 5173)
```powershell
cd c:\Users\tamil\OneDrive\Desktop\OrderSheilds\frontend
npm install
npm run dev
```
*Frontend will be accessible at: `http://localhost:5173/`*

### 2. Start the Spring Boot Backend Server (Port 8085)
```powershell
cd c:\Users\tamil\OneDrive\Desktop\OrderSheilds\backend
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
mvn spring-boot:run
```
*Backend REST API will be accessible at: `http://localhost:8085/api`*

---

## 8. Automated Testing Suite

The backend includes a comprehensive JUnit 5 integration suite that automatically validates the complete specification:

```powershell
cd c:\Users\tamil\OneDrive\Desktop\OrderSheilds\backend
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
mvn test
```

### Verified Test Scenarios (15/15 Passed):
- **Scenario A**: Owner orders to their own protected address $\rightarrow$ Instant pass, no alert generated.
- **Scenario B**: Active trusted family member orders to the protected address $\rightarrow$ Instant pass, no alert generated.
- **Scenario C**: Untrusted account orders to protected address $\rightarrow$ Status `PENDING_SECURITY_AUTHORIZATION`, `is_dispatch_blocked = true`, owner notification created.
- **Scenario D**: Owner approves pending request $\rightarrow$ Order transitions to `PROCESSING`, dispatch lock released.
- **Scenario E**: Owner rejects pending request $\rightarrow$ Order marked `CANCELLED`, permanently blocked from dispatch, inventory restored.
- **Scenario F**: No response $\rightarrow$ Dispatch remains blocked indefinitely.
- **Scenario G**: Unauthorized user attempts to approve another owner's request $\rightarrow$ Rejected with `403 Forbidden`.
- **Scenario H**: Customer attempts to forge dispatch flag or approve their own order $\rightarrow$ Denied with `403 Forbidden`.
- **Scenario I**: Revoked trusted member attempts to place a new order $\rightarrow$ OrderShield triggers security alert and blocks dispatch.
- **Scenario J**: Invalid input, negative prices, missing address fields $\rightarrow$ Rejected by Bean Validation with `400 Bad Request`.
- **Scenario L**: Admin dispatch queue $\rightarrow$ Admin cannot dispatch orders while authorization is pending (`409 Conflict`).

---

## 9. API Endpoint Reference

### Public Endpoints
- `GET /api/products` — Retrieve catalogue products (supports `?categoryId=`, `?search=`).
- `GET /api/products/{id}` — Retrieve detailed product information.
- `GET /api/categories` — Retrieve product categories.
- `POST /api/auth/login` — Authenticate and receive signed JWT.
- `POST /api/auth/register` — Create new customer account.

### Customer Endpoints (Bearer JWT Required)
- `GET /api/auth/me` — Current authenticated user profile.
- `POST /api/orders` — Create new order and evaluate OrderShield protection.
- `GET /api/orders/my-orders` — List current user's order history.
- `GET /api/shield/protected-addresses` — View customer's registered protected addresses.
- `POST /api/shield/protected-addresses` — Register and lock a new residential address.
- `GET /api/shield/members?addressId={id}` — List active household members for an address.
- `POST /api/shield/members/invite` — Invite or add a trusted household member.
- `DELETE /api/shield/members/{id}` — Revoke household member's permission.
- `GET /api/shield/requests/pending` — View pending authorization requests requiring owner decision.
- `POST /api/shield/requests/{id}/decision` — Approve or Reject a pending authorization request.
- `GET /api/notifications` — View user's security notifications.

### Admin Endpoints (`ROLE_ADMIN` Required)
- `GET /api/admin/orders` — View global order stream and authorization statuses.
- `POST /api/admin/orders/{id}/dispatch` — Dispatch an order (enforces authorization check).
- `PATCH /api/products/{id}/stock` — Update inventory levels.
- `GET /api/admin/audit-logs` — Review security audit log trail.

---

## 10. Teaching Notes: Architecture Decisions

1. **Why Normalization instead of exact string match?**
   People enter addresses in hundreds of slight variations ("Apt 4B" vs "Apartment 4-B", "St" vs "Street"). Without canonical normalization, any small typo would let an unauthorized order slip past the protection engine.

2. **Why Block Dispatch at the Database & Service Level?**
   Never trust frontend validation alone. If a client attempts to forge a dispatch request via `POST /api/admin/orders/1/dispatch`, the backend service checks the persistent `order.isDispatchBlocked()` flag and denies the transaction.

3. **Why Dual-Mode Frontend Architecture?**
   The frontend connects directly to the Spring Boot REST backend through Vite's API proxy. If the backend is ever offline or in standalone demo environments, the frontend gracefully falls back to a simulated in-memory store, ensuring smooth presentations without unexpected crashes.
