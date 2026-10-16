# API System Streamlining & Dynamic Key Provisioning

Streamline the API System by shortening navigation tab labels, removing all verbose explanatory paragraphs, and introducing request- and duration-based API key provisioning with admin-configurable free allowances and dynamic credit scaling.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The following decisions have been confirmed in Phase 1:

- **Minimalist Clean UI (Zero Explanatory Clutter)**: Remove all repetitive explanatory banners, subtitles, and security rule paragraphs (e.g. *"Manage provider-restricted bearer tokens..."*, *"Per-Provider Security Rule..."*, and top banner duplicates) across all pages.
- **Short Tab Names**: Navigation labels shortened across the top bar and sub-nav to:
  - `Playground` (`/api/playground`)
  - `Keys` (`/api/keys`)
  - `Quotas` (`/api/quotas`)
  - `Docs` (`/api/docs`)
- **Key Provisioning with Request & Duration Limits**:
  - Keys will be configured with a **Request Limit** and **Duration in Days**.
  - **Admin-Configurable Rates & Free Allowances**: A configurable rule set (e.g., 100 free requests, 7 free days; requests/days above free tier scale credit costs dynamically).
  - Credit cost is computed live as the user adjusts request and duration controls, and deducted from their balance upon creation.
  - Active keys track used vs. total allocated requests, as well as exact expiration date and remaining days.

---

### 1. Overview & Core Concept

- **What It Does**: Provides a distraction-free, ultra-clean developer experience aligned with the Secret design language. Developers can issue scoped API keys with tailored quotas (request counts and active days), monitor real-time expiration, and test scrapers without intrusive explanatory walls.
- **Key Value**: Replaces generic instructional text with functional, high-density controls and gives workspace administrators full flexibility over free allocations and credit costs.

---

### 2. User Experience & Visual Design

- **Visual Simplification**:
  - Remove all multi-sentence introductory paragraphs and advisory text boxes.
  - Retain only crisp UI controls, clean dashed cards (`border border-dashed border-zinc-300`), and tabular data.
- **Shortened Tab Bar**:
  - Clean segmented links: `Playground` · `Keys` · `Quotas` · `Docs`.
- **API Key Creation Modal Redesign**:
  - Provider Selector (e.g. Bilibili, GogoAnime, VidSrc)
  - Key Label input
  - **Request Quota Control**: Preset buttons (100 free, 500, 1,000, 5,000, 10,000) or custom number.
  - **Validity Duration Control**: Preset buttons (7 days free, 14, 30, 90, 365 days).
  - **Dynamic Credit Cost Calculator**: Shows base free allowance vs. additional credit charge.
- **Admin Configuration Panel**:
  - Accessible on the Quotas/Keys page to tweak default free requests, free days, and credit cost multipliers.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Elimination of Explanatory Copy**
  - *Chosen Approach*: Strip out all descriptions, introductory text, and rule warnings.
  - *Why*: Creates an uncluttered, professional interface matching the rest of the Secret application.

- **Decision 2: Admin-Configurable Allowances & Dynamic Credit Cost**
  - *Chosen Approach*: Store default admin settings:
    - `freeRequests`: 100
    - `freeDays`: 7
    - `costPer100ReqAboveFree`: 5 credits
    - `costPer30DaysAboveFree`: 10 credits
  - *Why*: Allows flexible pricing while ensuring every developer gets a baseline free tier before spending credits.

- **Decision 3: Hard Expiration & Request Ceiling Enforcement**
  - *Chosen Approach*: In `apiGateway.checkAndDeductQuota`, check both `key.requestsCount < key.maxRequests` and `Date.now() < key.expiresAt`.
  - *Why*: Ensures keys automatically deactivate when their allocated request or time limit is reached.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────┐
│      Navigation: Playground │ Keys │ Quotas │ Docs      │
└───────────────────────────┬────────────────────────────┘
                            │
          ┌─────────────────┴─────────────────┐
          ▼                                   ▼
┌───────────────────────────┐       ┌───────────────────────────┐
│       Keys Island         │       │       Quotas Island       │
│ - Compact key list        │       │ - Tier summary            │
│ - Request: used / max     │       │ - Admin Settings Drawer:  │
│ - Days remaining          │       │   * Free req & free days  │
│ - "Issue Key" Modal with  │       │   * Credit cost scales    │
│   dynamic credit counter  │       │ - Telemetry log           │
└─────────────┬─────────────┘       └─────────────┬─────────────┘
              │                                   │
              └─────────────────┬─────────────────┘
                                ▼
┌────────────────────────────────────────────────────────┐
│                   ApiGatewayStore                      │
│ - ApiKeyRecord: maxRequests, expiresAt, scopedProvider │
│ - AdminPolicy: freeRequests, freeDays, rates           │
│ - checkAndDeductQuota: enforces quota + expiration     │
└────────────────────────────────────────────────────────┘
```
