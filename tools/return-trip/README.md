# Return Trip Opportunity Engine

Identifies potentially profitable loads for the return journey.

## Inputs

- current_destination
- original_origin
- vehicle_type
- available_time
- candidate_loads

## Evaluation

For every compatible candidate load, calculate:

additional_revenue
additional_fuel_cost
additional_toll_cost
additional_operating_cost
additional_profit
route_compatibility
vehicle_compatibility
time_compatibility

## Output

Rank candidates by expected additional profit and operational compatibility.

A high-revenue load should not automatically rank first if it creates excessive additional cost, time or route risk.
