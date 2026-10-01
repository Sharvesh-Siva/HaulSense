# Trip Profitability Simulator

## Purpose

Determine whether a proposed trip is financially attractive.

## Inputs

- freight
- distance_km
- fuel_price
- vehicle_efficiency_kmpl
- toll_cost
- driver_cost
- other_cost

## Formulae

fuel_required_l = distance_km / vehicle_efficiency_kmpl
fuel_cost = fuel_required_l * fuel_price
total_cost = fuel_cost + toll_cost + driver_cost + other_cost
profit = freight - total_cost
margin_percent = (profit / freight) * 100
break_even_freight = total_cost

## Recommendation

- ACCEPT when margin meets the configured target
- NEGOTIATE when trip is viable but below target
- REVIEW when data or risk is uncertain
- REJECT when economics are unacceptable

All calculations must be deterministic and unit-tested.
