# HaulSense Agent Design

## Role

The HaulSense Agent is the decision orchestrator. It does not replace deterministic calculations.

## Tool Registry

### calculate_trip_profitability
Calculates fuel cost, total trip cost, profit, margin, break-even freight and recommendation.

### simulate_negotiation
Calculates minimum acceptable freight, target freight, expected profit and margin across scenarios.

### evaluate_trust
Calculates reliability and risk from historical driver/vehicle performance.

### find_return_opportunities
Ranks compatible return loads using additional revenue, cost, time and route compatibility.

## Decision Pattern

```text
User request
  -> intent detection
  -> required data
  -> tool selection
  -> deterministic tool execution
  -> optional additional tool
  -> result aggregation
  -> explainable recommendation
```

## Example

For "Should I accept this Chennai to Bangalore load for ₹18,000?":

1. Run profitability analysis.
2. If margin is weak, run negotiation simulation.
3. Evaluate driver/vehicle reliability when relevant.
4. Check return-load opportunities.
5. Produce a final recommendation with key numbers, reason, risk and suggested action.

## Constraint

The agent must cite tool results in its reasoning rather than fabricate financial calculations.
