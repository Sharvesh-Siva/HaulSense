# HaulSense

### Agentic Logistics Decision System for Small Transport Operators

HaulSense is an agentic logistics decision system designed to help small transport operators make better operational and financial decisions.

The system combines trip economics, driver/vehicle reliability, freight negotiation, and return-load opportunities into a single decision-making workflow.

---

## Problem

Small transport operators often make logistics decisions using:

- Phone calls
- WhatsApp conversations
- Spreadsheets
- Manual calculations
- Personal experience
- Fragmented driver records

This makes it difficult to answer critical questions such as:

- Is this trip actually profitable?
- What freight rate should I negotiate?
- Which driver or vehicle should handle this load?
- How risky is this trip?
- Can I find a profitable return load?
- How will fuel-price changes affect the margin?

Large logistics companies can use sophisticated fleet-management and optimization systems, but similar decision intelligence is often inaccessible to smaller operators.

---

## Solution

HaulSense acts as an AI logistics decision agent.

The agent receives a logistics request, analyzes the available information, invokes the appropriate decision tools, and produces an explainable recommendation.

### Core capabilities

1. Trip Profitability Simulator
2. What-if / Negotiation Simulator
3. Trust Passport
4. Return Trip Opportunity Engine
5. Agentic decision orchestration

The current implementation scope is the **agent workflow and deterministic decision tools**. Frontend mapping and external map-service integration are intentionally deferred.

---

## Core Agent Tools

### 1. Trip Profitability Simulator

Calculates:

- Expected revenue
- Fuel cost
- Toll cost
- Driver cost
- Other expenses
- Total trip cost
- Expected profit
- Profit margin
- Break-even freight rate
- Trip recommendation

Possible recommendations:

- ACCEPT
- NEGOTIATE
- REVIEW
- REJECT

---

### 2. What-if / Negotiation Simulator

Allows the operator to test scenarios such as:

- Higher freight rate
- Lower freight rate
- Higher fuel price
- Additional tolls
- Increased driver cost
- Different vehicle efficiency
- Different minimum profit margin

The system can calculate:

- Minimum acceptable freight
- Recommended negotiation target
- Expected profit at different rates
- Margin sensitivity

---

### 3. Trust Passport

Creates a reliability profile for drivers and vehicles.

Possible indicators:

- Completed trips
- On-time completion
- Cancellation rate
- Delay frequency
- Reliability score
- Average rating
- Experience
- Previous route performance

The Trust Passport is intended to support operational decisions rather than act as a permanent judgment of a person.

---

### 4. Return Trip Opportunity Engine

Evaluates potential loads for the return journey.

Instead of:

Origin → Destination → Empty Return

HaulSense attempts to identify:

Origin → Destination → Return Load → Origin

The engine evaluates:

- Return-load revenue
- Additional fuel
- Additional tolls
- Additional time
- Route compatibility
- Expected additional profit
- Risk

---

## Agent Workflow

```text
                    LOAD REQUEST
                         |
                         v
                 +---------------+
                 | HaulSense     |
                 | Agent         |
                 +---------------+
                         |
            +------------+------------+
            |            |            |
            v            v            v
       Profitability   Trust       Trip Data
         Tool         Passport
            |
            v
       Is the trip
       profitable?
            |
       +----+----+
       |         |
      YES       NO
       |         |
       |         v
       |    Negotiation
       |      Simulator
       |         |
       +----+----+
            |
            v
    Return Trip Engine
            |
            v
    Complete Trip-Cycle
       Optimization
            |
            v
    FINAL RECOMMENDATION
```

---

## Current Development Focus

The project is currently focused on the **agent workflow**, not frontend map implementation.

The immediate workflow is:

```text
Load Request
    ↓
Input Validation
    ↓
Trip Profitability Analysis
    ↓
Trust / Risk Evaluation
    ↓
Negotiation Simulation if required
    ↓
Return Trip Opportunity Analysis
    ↓
Combine Tool Results
    ↓
Explainable Final Recommendation
```

The agent must use deterministic tool outputs for numerical decisions and should not invent financial values.

---

## Technology Direction

### Agent / AI

- Gemini API
- Tool-based agent architecture

### Decision Tools

- Deterministic calculation modules
- JSON demo data
- Unit-testable business logic

### Frontend

Frontend implementation is currently deferred. No dependency on a map provider is required for the current agent-workflow phase.

### Data

Initial prototype:

- JSON
- Demo datasets
- Deterministic calculations

Future:

- Persistent trip history
- Driver profiles
- Vehicle records
- Load records

---

## Repository Structure

```text
haulsense-agent/
│
├── docs/            Problem, architecture and agent design
├── frontend/        Deferred user-interface layer
├── agent/           Agent orchestration
├── tools/           Deterministic logistics tools
├── data/            Demo data and schemas
└── tests/           Automated tests
```

---

## Status

🚧 Prototype / Hackathon Development

### Current priority

**Build and validate the agent workflow and its four deterministic tools.**

---

## Vision

Make practical logistics decision intelligence accessible to small transport operators without requiring expensive enterprise logistics software.

> What should the operator do with this trip, and why?

---

## Disclaimer

The financial and operational outputs generated by the prototype are estimates based on user-provided or simulated data.

They should not be treated as guaranteed financial outcomes.
