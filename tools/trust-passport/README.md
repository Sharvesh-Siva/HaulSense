# Trust Passport

Creates an operational reliability profile for drivers and vehicles.

## Inputs

- completed_trips
- on_time_trips
- cancelled_trips
- delayed_trips
- average_rating
- experience_years

## Metrics

on_time_rate = on_time_trips / completed_trips * 100

cancellation_rate = cancelled_trips / total_assigned_trips * 100

A weighted reliability score can combine on-time performance, cancellations, delays, ratings and sufficient historical volume.

## Output

- reliability_score
- risk_level
- summary

Trust scores are decision-support signals, not permanent labels. Missing or insufficient data should result in REVIEW rather than an invented score.
