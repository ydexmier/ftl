# Claude Agent Pipeline for "Lorcana Tournament Scouting Tool"

## 1️⃣ REPOSITORY LEARNING MODE

When starting a Claude session:

We are entering REPOSITORY LEARNING MODE.

I will send you the project files in multiple messages.

Your role:
- Read and understand the code
- Build a mental model of the architecture
- Do NOT refactor
- Do NOT suggest improvements yet

For every message reply ONLY:
"File learned and indexed."

Wait for the next file.

Send the files by batch:
- /app
- /src
- /components
- /hooks
- /lib
- /models
- /styles
- package.json
- tsconfig.json
- README

Then finish with:

Repository upload finished.
Switch to architecture analysis mode.

## 2️⃣ FULL ARCHITECTURE ANALYSIS MODE

You have finished learning the repository.

Switch to FULL ARCHITECTURE ANALYSIS MODE.

Produce a complete technical report of the project.

---

## 1. Next.js architecture

Explain:
- App Router structure (/app)
- Layouts and nested layouts
- Server vs Client Components usage
- Route handlers / API routes
- Server Actions usage (if any)

---

## 2. React architecture

Analyze:
- Components organization
- Custom hooks
- State management patterns
- Separation between UI and logic

---

## 3. MongoDB integration

Explain:
- How database access is implemented
- Data fetching strategy
- Models / schemas used
- Where queries are performed

---

## 4. Tailwind usage

Analyze:
- Styling strategy
- Component styling patterns
- Reusability of UI components

---

## 5. Data flow

Describe end-to-end flow:
External Tournament API → Database → Server → React UI

---

## 6. Business domain understanding

Explain how the scouting system works:
- Tournament rounds
- Player ↔ table matching
- Deck color observations
- Historical tracking

---

## 7. Domain model reconstruction

Rebuild the data model:
Player, Round, Table, Match, Deck, Observation.

---

## 8. Strengths of the architecture

## 9. Weaknesses / tech debt / risks

Be extremely precise and structured.
This report will be used to refactor safely.

## 3️⃣ ARCHITECTURE CIBLE

Using the previous analysis, design the TARGET architecture.

Constraints:
- Keep behavior intact
- Refactor progressively
- Follow Next.js + MongoDB best practices

---

## Design the ideal architecture:

### Folder structure
/app
/components
/hooks
/src/domain
/src/services
/src/repositories
/src/lib
/src/types
/docs

---

### Define responsibilities

DOMAIN:
Entities and business rules.

SERVICES:
Scouting logic, matching logic, round logic.

REPOSITORIES:
MongoDB access and external API calls.

APP LAYER:
Routing and data fetching.

COMPONENTS:
UI only.

---

Explain:
- What must be moved
- What must stay
- What must be created
- Migration plan step-by-step
