# HaulSense Tool Contracts

These contracts describe the conceptual interface between the agent and deterministic implementation.

## 1. calculate_trip_profit

**Purpose:** Establish baseline outbound-trip economics.

**Inputs:** freight, distance, fuel price, vehicle efficiency, tolls, driver cost, other costs.

**Outputs:** fuel required, fuel cost, total cost, profit, margin, break-even freight, recommendation signal.

## 2. what_if_simulator

**Purpose:** Test sensitivity to changes in freight, fuel, tolls, mileage, or other operating assumptions.

**Outputs:** scenario results and margin sensitivity.

## 3. get_trust_passport

**Purpose:** Retrieve historical driver reliability and trust signals.

**Outputs:** trust score, on-time rate, cancellations, incidents, reliability signal.

## 4. find_return_trip

**Purpose:** Evaluate compatible backhaul opportunities and complete trip-cycle economics.

**Outputs:** compatible loads, incremental revenue/cost, cycle profit, improvement, recommendation.

## 5. match_vehicle

**Purpose:** Match a shipment to an available vehicle based on payload and cargo compatibility.

## 6. simulate_negotiation

**Purpose:** Determine a commercially realistic counter-offer when the offered freight is below the target margin.

**Business guardrail:** if the required uplift exceeds 25%, the negotiation is considered commercially unrealistic and the final action should be REJECT.

## 7. evaluate_risk

**Purpose:** Convert operational risk factors into a deterministic risk score and level.

Suggested levels:

- LOW: 0–24
- MEDIUM: 25–49
- HIGH: 50+

## 8. submit_recommendation

**Purpose:** Terminal action that records the final operational commitment.

Required fields:

```text
action
reasoning
decisionFactors[3..5]
nextAction
```

The agent must not bypass this terminal action when a decision is complete.

## Agent Rule

The model can decide which tool to call, but it cannot override deterministic tool outputs with invented numbers.
