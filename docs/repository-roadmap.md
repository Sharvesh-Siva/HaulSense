# HaulSense Repository Roadmap

This repository is intentionally organized as a sequential engineering record. Read it from Phase 0 to Phase 5 rather than treating the folders as unrelated code.

## Phase 0 — Problem Definition

`docs/problem-statement.md`

Defines the operational problem for small transport operators: fragmented trip information, uncertain profitability, weak negotiation intelligence, reliability uncertainty, and empty return journeys.

## Phase 1 — System Architecture

`docs/system-architecture.md`
`docs/agent-design.md`

Defines the system boundary and the agent/tool relationship.

Core principle:

> AI decides; deterministic code calculates.

The language model selects tools, observes tool results, reasons over trade-offs, and produces the final operational recommendation. Financial arithmetic and risk calculations remain deterministic.

## Phase 2 — Conceptual Tool Layer

`tools/`

The conceptual tool contracts are:

1. `calculate_trip_profit`
2. `what_if_simulator`
3. `get_trust_passport`
4. `find_return_trip`
5. `match_vehicle`
6. `simulate_negotiation`
7. `evaluate_risk`
8. `submit_recommendation`

These are not eight unrelated features. They are capabilities available to the HaulSense Agent.

## Phase 3 — Data and Decision Logic

`data/`
`tests/`

Demo trips, drivers, vehicles, loads, and schemas provide deterministic inputs. Tool outputs must be reproducible from the same inputs.

## Phase 4 — Complete Application Implementation

The AI Studio export supplied for HaulSense contains the actual implementation layer: React/Vite frontend, Express server, Gemini agent client, orchestrator, system prompt, deterministic tools, mock data, portals, dashboards, diagnostics, and shared context.

The implementation should be represented under the repository's application layer while preserving the architecture and documentation above it.

The implementation must retain the following behavior:

- Agent dynamically selects tools instead of blindly executing every tool.
- Deterministic tools perform arithmetic.
- The agent observes tool results and decides what evidence is still required.
- `submit_recommendation` is the terminal decision action.
- The final action can be ACCEPT, ACCEPT + SECURE RETURN LOAD, NEGOTIATE, REASSIGN, WAIT, or REJECT.

## Phase 5 — Validation

Use the diagnostic and scenario tests to verify that the implementation reproduces the expected decisions for the Golden Case and the defined edge cases.

### Golden validation path

```text
Shipment Request
  -> Trip Profitability
  -> Return-Cycle Economics
  -> Trust / Risk when relevant
  -> Negotiation when required
  -> Final Recommendation
```

### Important scope decision

Frontend map integration is deferred. There is no dependency on Leaflet, OpenStreetMap, or Google Maps for the current agentic workflow implementation.

## Reading Order

1. `README.md`
2. `docs/problem-statement.md`
3. `docs/system-architecture.md`
4. `docs/agent-design.md`
5. `docs/implementation-architecture.md`
6. `docs/tool-contracts.md`
7. `docs/validation-scenarios.md`
8. `docs/cumulative-build-prompt.md`
9. `agent/README.md`
10. `tools/*/README.md`
11. Application source
12. Tests / diagnostics
