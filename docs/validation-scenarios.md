# HaulSense Validation Scenarios

These scenarios are the ground-truth checks for the complete implementation.

## S-GOLDEN — Chennai → Bengaluru

- Cargo: 7t FMCG
- Offered freight: ₹25,000
- Distance: 350 km
- Fuel baseline: ₹92/L
- Expected outbound fuel cost: ₹8,050
- Expected total cost: ₹13,550
- Expected outbound profit: ₹11,450
- Expected outbound margin: 45.8%
- Empty-return cycle net: ₹1,150
- Secured backhaul cycle profit: ₹15,500
- Expected improvement from backhaul: ₹14,350
- Expected action: `ACCEPT + SECURE RETURN LOAD`

## S-CASE-A — Chennai → Vellore

- Cargo: 5t general
- Offered freight: ₹12,000
- Distance: 140 km
- Expected profit: ₹6,480
- Expected margin: 54.0%
- Expected action: `ACCEPT`

## S-CASE-B — Chennai → Madurai

- Cargo: 9t general
- Offered freight: ₹21,000
- Distance: 460 km
- Expected profit: ₹3,520
- Expected margin: 16.8%
- Target counter-offer: ₹21,850
- Expected uplift: approximately 4.0%
- Expected action: `NEGOTIATE`

## S-CASE-D — Chennai → Bengaluru Electronics

- High-value cargo
- Tight deadline slack: 1.2h
- Assigned driver: DRV-002
- Driver trust score: 54
- Incidents: 3
- Expected risk: HIGH
- Expected action: `REASSIGN`

## S-CASE-E — Chennai → Kochi

- Cargo: 10t general
- Offered freight: ₹24,000
- Distance: 700 km
- Expected total cost: ₹26,900
- Expected profit: -₹2,900
- Expected margin: -12.1%
- Required counter-offer uplift: approximately 40.2%
- Expected action: `REJECT`

## Validation Rule

The implementation should reproduce the expected action and the deterministic numerical values within any explicitly configured rounding tolerance.

If a result differs, inspect the tool calculation before changing the agent prompt. Do not solve deterministic calculation errors by prompting the model to 'reason harder'.
