# HaulSense — Cumulative Build Prompt

This is the canonical reconstruction prompt for the current HaulSense implementation. It consolidates the project decisions, corrections, architecture, workflow, tool behavior, implementation constraints, and scope decisions established during development.

> Use this prompt when rebuilding or extending HaulSense in an AI coding environment. Preserve the existing architecture and behavior unless a deliberate change is explicitly requested.

---

## MASTER PROMPT

Build **HaulSense — Agentic Freight Decision Platform**, an AI-assisted logistics decision system for small transport operators and fleet owners in India.

### Mission

Solve the operational question:

> **Should the operator accept this shipment, negotiate it, reassign it, wait, or reject it — and what evidence supports that decision?**

Do not build HaulSense as a generic chatbot, truck-booking marketplace, or simple profitability calculator. The central product is an **agentic decision system** in which an AI agent orchestrates deterministic logistics tools and produces an explainable operational recommendation.

### Target User

Small transport operators, fleet owners, dispatchers, and logistics managers who currently rely on phone calls, WhatsApp, spreadsheets, manual calculations, and personal experience.

### Core Problem

The operator needs to reason simultaneously about trip economics, driver/vehicle reliability, freight negotiation, operational risk, and return-load opportunities. An outbound trip can appear profitable while an empty return destroys its economics. A cheap load can become viable after negotiation. A high-value or time-critical shipment can require reassignment even when the economics are good.

### Core Architecture

Implement the system as:

```text
User / Shipment Request
        ↓
Input Validation
        ↓
HaulSense Agent
        ↓
Dynamic Tool Selection
        ↓
Deterministic Logistics Tools
        ↓
Evidence Aggregation
        ↓
Operational Reasoning
        ↓
Terminal Recommendation
```

The agent is the orchestrator. Tools are deterministic capabilities. The UI displays results but is not the source of financial truth.

### Golden Rule

**AI decides; code calculates.**

The AI MUST NOT independently calculate rupee amounts, fuel costs, margins, transit slack, risk points, break-even values, or other numerical business outputs when a deterministic tool can calculate them.

The AI may:

- understand the user's objective;
- choose tools dynamically;
- provide a short purpose before each tool call;
- inspect exact tool results;
- compare trade-offs;
- decide whether more evidence is needed;
- formulate the final recommendation.

Deterministic TypeScript code must calculate numerical values.

### Agent Tools

Implement these eight conceptual capabilities:

1. `calculate_trip_profit`
   - fuel requirement;
   - fuel cost;
   - operating cost;
   - profit;
   - margin;
   - break-even freight;
   - baseline recommendation signal.

2. `what_if_simulator`
   - test freight changes;
   - fuel-price changes;
   - toll changes;
   - mileage/efficiency changes;
   - compare scenario margins.

3. `get_trust_passport`
   - driver trust score;
   - on-time rate;
   - cancellations;
   - incidents;
   - reliability signal;
   - replacement-driver evidence when needed.

4. `find_return_trip`
   - identify compatible backhauls;
   - evaluate return-load revenue;
   - calculate incremental return cost;
   - calculate complete trip-cycle economics;
   - determine whether securing a return load materially improves the decision.

5. `match_vehicle`
   - match shipment to available vehicles;
   - validate payload capacity;
   - validate cargo compatibility.

6. `simulate_negotiation`
   - determine minimum acceptable freight;
   - determine target freight;
   - calculate counter-offer economics;
   - enforce commercial realism.

   **Guardrail:** if the required uplift exceeds 25%, negotiation is commercially unrealistic and the final action should be `REJECT`.

7. `evaluate_risk`
   - calculate deterministic operational risk points;
   - classify LOW / MEDIUM / HIGH.

   Suggested levels:
   - LOW: 0–24
   - MEDIUM: 25–49
   - HIGH: 50+

8. `submit_recommendation`
   - terminal business action;
   - required fields: action, reasoning, 3–5 decision factors, next action;
   - no conversational final answer after the terminal action.

### Agent Tool-Calling Discipline

- Do not call all tools in a rigid fixed sequence.
- Select only tools that can materially affect the outcome.
- Every tool call must have a short professional purpose sentence visible to the manager.
- Start with trip economics because it establishes the financial baseline.
- Check trust when cargo is high-value, timing is tight, or driver reliability is uncertain.
- Check vehicle matching when no suitable vehicle is assigned or payload compatibility must be verified.
- Check return-trip economics when deadhead risk can materially affect the complete trip cycle.
- Use what-if simulation for sensitivity questions.
- Use negotiation when the margin is below target/floor.
- Evaluate risk before committing to ACCEPT or REASSIGN.
- Stop when enough factual evidence exists.
- Finish only through `submit_recommendation`.

### Permitted Final Actions

- `ACCEPT`
- `ACCEPT + SECURE RETURN LOAD`
- `NEGOTIATE`
- `REASSIGN`
- `WAIT`
- `REJECT`

Interpretation:

**ACCEPT** — healthy economics, acceptable risk, verified driver/vehicle.

**ACCEPT + SECURE RETURN LOAD** — the outbound trip is viable and an identified compatible backhaul materially improves the complete trip cycle.

**NEGOTIATE** — margin is below target but a commercially realistic counter-offer can fix it.

**REASSIGN** — operational risk is too high for the current driver/vehicle, but a qualified alternative exists.

**WAIT** — a critical prerequisite is pending.

**REJECT** — loss-making economics, commercially unrealistic negotiation, or unmitigated high risk.

### Core Business Model

HaulSense must evaluate the **complete trip cycle**, not just outbound revenue.

```text
Outbound Trip
    ↓
Delivery
    ↓
Empty Return penalty OR compatible return load
    ↓
Complete Trip-Cycle Economics
```

A return load should be recommended only when it is compatible and its incremental economics justify the operational impact.

### Baseline Business Data

Use the current prototype baseline of diesel at **₹92/L** unless the user explicitly supplies another value.

Keep all values configurable in deterministic code/data rather than hardcoding them into natural-language reasoning.

### Ground-Truth Scenarios

The implementation must preserve these validation cases:

**S-GOLDEN — Chennai → Bengaluru**
- 7t FMCG;
- ₹25,000 freight;
- 350 km;
- expected fuel cost ₹8,050;
- total cost ₹13,550;
- outbound profit ₹11,450;
- outbound margin 45.8%;
- empty-return cycle net ₹1,150;
- secured backhaul cycle profit ₹15,500;
- expected improvement +₹14,350;
- final action: `ACCEPT + SECURE RETURN LOAD`.

**S-CASE-A — Chennai → Vellore**
- 5t general;
- ₹12,000 freight;
- 140 km;
- profit ₹6,480;
- margin 54.0%;
- final action: `ACCEPT`.

**S-CASE-B — Chennai → Madurai**
- 9t general;
- ₹21,000 freight;
- 460 km;
- profit ₹3,520;
- margin 16.8%;
- target counter-offer ₹21,850;
- uplift approximately 4.0%;
- final action: `NEGOTIATE`.

**S-CASE-D — Chennai → Bengaluru Electronics**
- high-value cargo;
- deadline slack 1.2h;
- assigned driver DRV-002;
- trust score 54;
- 3 incidents;
- high risk;
- final action: `REASSIGN` to a qualified driver such as DRV-001 or DRV-003.

**S-CASE-E — Chennai → Kochi**
- 10t general;
- ₹24,000 freight;
- 700 km;
- total cost ₹26,900;
- loss ₹2,900;
- margin -12.1%;
- required counter-offer uplift approximately 40.2%;
- final action: `REJECT`.

### Implementation Requirements

Use a production-style TypeScript architecture with:

- React + Vite frontend;
- Express server;
- Gemini API integration;
- typed agent/tool interfaces;
- Zod validation where appropriate;
- deterministic calculation modules;
- demo/mock logistics data;
- diagnostics/ground-truth validation;
- manager workspace;
- driver workspace;
- trip chat/agent interface;
- dashboards and analytical views.

Keep the implementation modular. Do not put all business logic in one React component or one giant server file.

### UI Requirements

The UI should communicate operational intelligence, not generic AI aesthetics.

Provide:

- manager dashboard;
- shipment/trip analysis;
- agent interaction/timeline;
- recommendation card;
- drivers;
- vehicles;
- return loads;
- diagnostics;
- driver portal;
- trust and earnings views where supported by the existing implementation.

The frontend is a consumer of the decision layer.

### Mapping Scope

**Do not require Leaflet, OpenStreetMap, Google Maps, or any map API for the current implementation.** Mapping is explicitly deferred because the current project priority is the agentic workflow and deterministic decision engine.

Do not introduce map dependencies merely for visual effect.

### Security and Configuration

- Never commit real API keys.
- Use environment variables.
- Provide `.env.example`.
- Keep credentials out of source control.

### Testing Principle

If a numerical validation fails:

1. inspect the deterministic tool;
2. inspect its input data;
3. inspect its formula;
4. inspect rounding/configuration;
5. only then inspect agent orchestration.

Do not solve deterministic calculation errors by making the model prompt more verbose.

### Documentation Requirement

Keep this prompt in `docs/cumulative-build-prompt.md` as the canonical cumulative specification.

Also maintain:

- problem statement;
- architecture;
- implementation architecture;
- tool contracts;
- validation scenarios;
- repository roadmap.

The repository should tell a sequential story from **problem → architecture → conceptual tools → implementation → validation**.

### Final Quality Bar

The finished system should make a reviewer understand, without reading every source file:

1. what logistics problem HaulSense solves;
2. why an agent is required;
3. what tools the agent can use;
4. which calculations are deterministic;
5. how the agent dynamically decides what evidence to gather;
6. how complete trip-cycle economics are evaluated;
7. how the final operational recommendation is produced;
8. how the implementation is validated against ground-truth scenarios.

Do not describe HaulSense as merely an AI chatbot. Describe it as an **agentic logistics decision system with deterministic operational tools**.
