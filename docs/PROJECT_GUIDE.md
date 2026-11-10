# HaulSense — Project Guide

## 1. Product overview
HaulSense is an AI-assisted freight decision and fleet operations platform. Its central question is: **Should this shipment be accepted, negotiated, reassigned, delayed for more information, or accepted only when a suitable return load is secured?**

It combines deterministic logistics tools with an AI agent that interprets a request, selects tools and explains returned evidence.

## 2. Intended users

**Fleet manager / dispatcher:** evaluates shipment opportunities, fleet availability, driver suitability, trip economics, backhaul options and operational exceptions.

**Driver:** uses the driver-facing workspace for assigned trips, trip map, vehicle information, load opportunities, earnings, trust information, vehicle health, documents and communication.

A visible role selector is not an authorization boundary. Access must be validated by the server against the authenticated identity.

## 3. Manager journey
1. Review a shipment opportunity.
2. Inspect origin, destination, cargo, offered freight and constraints.
3. Ask the agent for an operational recommendation.
4. Let the agent select deterministic tools.
5. Inspect cost, margin, break-even, vehicle fit, driver reliability and risk evidence.
6. Compare return-load options and trip-cycle outcomes.
7. Review decisive factors.
8. Make the final dispatch or negotiation decision through an authorized workflow.

## 4. Driver journey
1. Authenticate as a driver.
2. Review assigned trips.
3. Inspect shipment, pickup and delivery information.
4. Review available trip map and route information.
5. Perform only the lifecycle action currently permitted.
6. Communicate delays, incidents or breakdowns.
7. Confirm delivery using the configured proof-of-delivery process.

A browser map is not proof of live device tracking. The telemetry source, permission, timestamp and live/stale status must be explicit.

## 5. Agent operating model
The agent coordinates deterministic tools; it is not the arithmetic engine.

- Trip profitability: fuel and operating costs, profit, margin and break-even freight.
- What-if simulation: recompute outcomes under changed assumptions.
- Driver trust: return configured reliability and incident indicators.
- Return-trip search: identify compatible backhauls and evaluate trip-cycle economics.
- Vehicle matching: check payload and cargo compatibility.
- Negotiation simulation: calculate counter-offer boundaries from configured margins.
- Risk evaluation: apply the configured point-based risk model.
- Recommendation submission: validate and record a structured recommendation.

Decision outputs: ACCEPT, ACCEPT + SECURE RETURN LOAD, NEGOTIATE, REASSIGN, WAIT and REJECT.

The agent must not invent prices, distances, driver records, traffic conditions or route alternatives.

## 6. Calculation principles
- Keep financial and logistics arithmetic in deterministic, testable code.
- Validate tool inputs and outputs with schemas.
- Keep units explicit: INR, litres, kilometres, hours, tonnes and percentages.
- Make assumptions visible.
- Recalculate derived values when source inputs change.
- Keep simulation results separate from committed operational records.
- Make risk scores explainable.
- Never use generated narrative as the source of a numerical result.

Business constants are centralized in `src/config.ts`. Changing them is a business-rule change, not merely a cosmetic edit.

## 7. Trip-cycle economics
An outbound shipment may appear profitable while the return journey creates substantial empty-running cost.

```text
Outbound contribution = outbound freight - outbound operating cost
Empty-return result = outbound contribution - empty-return operating cost
Secured-backhaul result = outbound contribution
  + return-load contribution - applicable trip-cycle costs
```

The actual code and configured cost model are authoritative. This guide avoids duplicating every formula so documentation does not silently diverge from implementation.

## 8. Trip lifecycle integrity
Trip transitions must be sequential and validated on the server. Hiding or disabling a client-side button is not sufficient protection.

Operational events can include shipment creation, driver/vehicle assignment, trip acceptance, pickup arrival, cargo collection, delivery arrival, delivery confirmation, completion, delay, breakdown and route deviation.

GPS proximity alone must not confirm cargo collection or delivery. Use explicit confirmation and proof-of-delivery evidence where configured.

## 9. Maps and telemetry
The application includes Google Maps dependencies and a Live Fleet Tracking route. The inspected server source also contains seeded telemetry whose initial records are marked `isLiveDeviceGps: false`.

- A rendered map demonstrates map integration, not necessarily live tracking.
- Seeded coordinates are demo telemetry, not verified driver-phone coordinates.
- Route recommendations must be based on actual routing responses.
- Browser geolocation cannot guarantee reliable tracking after the browser is closed or the device is locked.
- Screen-locked tracking requires an appropriate native Android foreground location service, user permission and visible notification.

## 10. Current prototype boundaries
The server uses in-memory stores for sessions, audit events and fleet telemetry, and imports seeded shipment, driver and vehicle data. In-memory stores are not durable and do not synchronize across server instances.

The repository contains demo authentication and simulator behavior. These must not be treated as production identity verification. Do not claim persistent cloud storage, production identity, eGain deployment or native background tracking unless separately configured and verified.

## 11. Technical map
- `src/App.tsx`: routes and protected manager/driver wrappers.
- `src/context/`: authentication and logistics state.
- `src/agent/`: agent orchestration.
- `src/tools/`: deterministic logistics tools.
- `src/types/`: shared domain and API types.
- `src/data/`: seeded/demo domain data.
- `src/pages/`: manager and driver workspaces.
- `server.ts`: Express API, session handling and operational endpoints.
- `src/config.ts`: model and logistics constants.

## 12. Feature review checklist
- Uses authoritative backend data.
- Authenticates and authorizes the actor.
- Validates inputs and state transitions.
- Shows stale/offline/error states.
- Keeps numerical outputs deterministic and traceable.
- Distinguishes demo records from live records.
- Prevents cross-driver and cross-organization data access.
- Updates tests and documentation.
