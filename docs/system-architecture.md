# HaulSense System Architecture

## Current Architecture

```text
+-----------------------+
|   INPUT / USER DATA   |
| Load + Trip Details   |
+-----------+-----------+
            |
            v
+-----------------------+
|     HAULSENSE AGENT   |
| intent | validation   |
| tool routing | reason |
| result aggregation    |
+-----------+-----------+
            |
   +--------+--------+--------+--------+
   |                 |                 |
   v                 v                 v
Profitability   Negotiation       Trust Passport
   |                 |                 |
   +-----------------+-----------------+
                     |
                     v
             Return Trip Engine
                     |
                     v
             Decision Aggregation
                     |
                     v
          EXPLAINABLE RECOMMENDATION
```

## Agent Layer

The agent interprets the request, validates required inputs, selects the appropriate deterministic tools, supplies inputs, checks results, invokes additional tools when required, and explains the final recommendation.

## Tool Layer

The four core tools are:

1. Trip Profitability Simulator
2. What-if / Negotiation Simulator
3. Trust Passport
4. Return Trip Opportunity Engine

Numerical calculations are deterministic. The language model should not invent financial outputs when a tool can calculate them.

## Workflow

```text
Load Request
    ↓
Validate Inputs
    ↓
Profitability Analysis
    ↓
Trust / Risk Evaluation
    ↓
Negotiation Simulation if required
    ↓
Return Trip Analysis
    ↓
Aggregate Results
    ↓
ACCEPT / NEGOTIATE / REVIEW / REJECT
```

## Data Layer

The current prototype uses JSON demo data for:

- Drivers
- Vehicles
- Loads
- Trip inputs

Persistent storage can be introduced later.

## Frontend Scope

Frontend implementation is intentionally deferred during the current phase. The agent and decision-tool workflow must be validated independently of any mapping or external map-service integration.

## Design Principle

**AI orchestrates; deterministic tools calculate.** This is central to HaulSense reliability, explainability, and testability.
