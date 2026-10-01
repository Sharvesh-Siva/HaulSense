# HaulSense Complete Implementation Source Map

The current AI Studio export is the reference implementation for the application layer. It contains 66 files. This document maps that implementation into the sequential repository architecture.

## 1. Runtime foundation

```text
package.json
server.ts
vite.config.ts
index.html
tsconfig.json
.env.example
```

`server.ts` provides the Express runtime, health endpoint, trip-chat API, and SSE endpoint for agent execution. Vite serves the React application during development.

## 2. Agent layer

```text
src/agent/clientStream.ts
src/agent/orchestrator.ts
src/agent/systemPrompt.ts
```

- `systemPrompt.ts` defines the agent's operational policy.
- `orchestrator.ts` implements the multi-step tool-calling loop, replanning, guardrails, and terminal recommendation.
- `clientStream.ts` consumes streamed agent events in the UI.

## 3. Deterministic tool layer

```text
src/tools/declarations.ts
src/tools/index.ts
src/tools/calculateTripProfit.ts
src/tools/whatIfSimulator.ts
src/tools/simulateNegotiation.ts
src/tools/findReturnTrip.ts
src/tools/evaluateRisk.ts
src/tools/matchVehicle.ts
src/tools/getTrustPassport.ts
src/tools/submitRecommendation.ts
```

These are the operational capabilities exposed to the agent. Numerical calculations remain deterministic and independently testable.

## 4. Data and domain model

```text
src/data/mockData.ts
src/types/index.ts
src/config.ts
src/utils/index.ts
```

These files hold the prototype's domain types, demo logistics records, business constants, and shared utility functions.

## 5. Application context

```text
src/context/AuthContext.tsx
src/context/LogisticsContext.tsx
```

These provide authentication/demo-user state and shared logistics application state.

## 6. Application shell

```text
src/main.tsx
src/App.tsx
src/index.css
```

These initialize the React application, route the application, and provide the global visual system.

## 7. Manager workspace

```text
src/components/ManagerLayout.tsx
src/components/ManagerGraphicalAnalytics.tsx
src/components/AgentTimeline.tsx
src/components/RecommendationCard.tsx
src/components/FindingsCards.tsx
src/components/TripChatDrawer.tsx
src/pages/DashboardPage.tsx
src/pages/ShipmentsPage.tsx
src/pages/VehiclesPage.tsx
src/pages/DriversPage.tsx
src/pages/ReturnLoadsPage.tsx
src/pages/TripChatPage.tsx
src/pages/AgentPage.tsx
src/pages/DiagnosticsPage.tsx
```

The manager workspace exposes operational intelligence and the agent's evidence trail rather than presenting a generic chatbot.

## 8. Driver workspace

```text
src/pages/DriverPortalPage.tsx
src/pages/driver/DriverLayout.tsx
src/pages/driver/DriverOverviewPage.tsx
src/pages/driver/DriverTripsPage.tsx
src/pages/driver/DriverLoadsPage.tsx
src/pages/driver/DriverMatchingPage.tsx
src/pages/driver/DriverTrustPage.tsx
src/pages/driver/DriverHealthPage.tsx
src/pages/driver/DriverEarningsPage.tsx
src/pages/driver/DriverVehiclesPage.tsx
src/pages/driver/DriverDocumentsPage.tsx
src/pages/driver/DriverAssistModal.tsx
src/pages/driver/DriverNotificationsModal.tsx
src/pages/driver/DriverProfileModal.tsx
```

This layer demonstrates the operator/driver workflow around assignments, loads, trust, vehicle matching, earnings, documents, and trip assistance.

## 9. Shared visual components

```text
src/components/ErrorBoundary.tsx
src/components/Badges.tsx
src/components/Emblem.tsx
src/components/DriverGraphicalTelemetry.tsx
```

## 10. Routing fallbacks

```text
src/pages/LandingPage.tsx
src/pages/NotFoundPage.tsx
```

## Deliberately deferred

The AI Studio implementation does **not** require Leaflet, OpenStreetMap, Google Maps, or another mapping API. Mapping remains outside the current implementation scope.

## Repository relationship

The repository should be read in this order:

```text
Problem
  ↓
System Architecture
  ↓
Tool Contracts
  ↓
Data / Decision Model
  ↓
Agent Design
  ↓
Implementation Source Map
  ↓
AI Studio Application Source
  ↓
Validation Scenarios
  ↓
Cumulative Build Prompt
```

The conceptual `docs/` layer explains why the system exists and how it should behave. The AI Studio export is the reference implementation of that design.
