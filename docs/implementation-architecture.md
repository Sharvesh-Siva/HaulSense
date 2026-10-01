# HaulSense Implementation Architecture

This document bridges the conceptual architecture and the complete AI Studio implementation.

## 1. Runtime Layers

```text
React UI
   |
   v
Application Context / Routing
   |
   v
Agent Client / SSE Stream
   |
   v
Express Server
   |
   v
Gemini Agent Orchestrator
   |
   +-------------------------------+
   |                               |
   v                               v
Tool Registry                  Agent System Prompt
   |
   +---- calculate_trip_profit
   +---- what_if_simulator
   +---- get_trust_passport
   +---- find_return_trip
   +---- match_vehicle
   +---- simulate_negotiation
   +---- evaluate_risk
   +---- submit_recommendation
   |
   v
Deterministic TypeScript Logic
   |
   v
Mock / Demo Logistics Data
```

## 2. Agent Responsibilities

The orchestrator is responsible for:

- understanding the dispatch question;
- determining which evidence is necessary;
- selecting tools dynamically;
- providing a short public purpose before each tool call;
- observing exact tool results;
- deciding whether another tool can change the outcome;
- stopping when enough evidence exists;
- finishing through `submit_recommendation`.

The agent must not perform independent financial arithmetic.

## 3. Deterministic Tool Responsibilities

Tools calculate facts that must remain reproducible:

- fuel consumption;
- fuel cost;
- operating cost;
- profit;
- margin;
- break-even freight;
- what-if sensitivity;
- trust score;
- risk points;
- vehicle compatibility;
- return-trip economics;
- negotiation thresholds.

## 4. Terminal Decision

`submit_recommendation` is the terminal business action. The agent should not finish with an unstructured natural-language verdict after tool execution.

The terminal payload contains:

- action;
- reasoning;
- 3–5 decisive factors;
- concrete next action.

Allowed actions:

- ACCEPT
- ACCEPT + SECURE RETURN LOAD
- NEGOTIATE
- REASSIGN
- WAIT
- REJECT

## 5. Complete Decision Flow

```text
1. Receive shipment request
2. Validate available shipment data
3. Calculate outbound economics
4. Determine whether driver/vehicle evidence matters
5. Evaluate trust and/or vehicle compatibility when relevant
6. Evaluate return-trip economics when it can change the result
7. Run what-if analysis when sensitivity matters
8. Run negotiation when margin is below target/floor
9. Evaluate operational risk before ACCEPT/REASSIGN
10. Submit one definitive recommendation
```

This is an adaptive workflow, not a fixed eight-tool pipeline. Tools that cannot change the outcome should be skipped.

## 6. UI Is a Consumer of Decisions

The dashboard, portals, diagnostics, trip chat, and analytics components display the decision system. They must not become an alternative source of financial truth.

## 7. Current Scope Constraint

Map-provider implementation is deferred. The agent workflow and deterministic decision layer must work without Leaflet, OpenStreetMap, Google Maps, or any external mapping API.
