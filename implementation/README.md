# HaulSense Complete Implementation

This directory represents the implementation layer of HaulSense, distinct from the conceptual architecture in `docs/`.

## Reference implementation

The complete application was generated/exported from Google AI Studio and reviewed as the current implementation reference. The export contains 66 files across the React application, Express server, agent orchestrator, deterministic tools, domain types, mock data, manager workspace, driver workspace, and shared UI.

## Implementation stack

- React 19
- Vite 8
- TypeScript
- Express
- Gemini SDK (`@google/genai`)
- Zod
- React Router
- Recharts
- Tailwind CSS
- Lucide React
- Motion

## Runtime flow

```text
React Application
      ↓
Manager / Driver Workspace
      ↓
Agent Client Stream
      ↓
POST /api/agent/run
      ↓
Express Server
      ↓
runAgentOrchestrator()
      ↓
Gemini Tool Calling
      ↓
Deterministic Tool Execution
      ↓
Guardrail Validation
      ↓
submit_recommendation
      ↓
SSE Agent Events
      ↓
Recommendation UI
```

## Core implementation files

```text
server.ts
src/agent/orchestrator.ts
src/agent/systemPrompt.ts
src/agent/clientStream.ts
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
src/config.ts
src/types/index.ts
src/data/mockData.ts
```

## Business constants

The implementation centralizes key operating assumptions in `src/config.ts`, including diesel price, target margin, floor margin, negotiation uplift limit, return-load matching constraints, agent step limits, and replanning limits.

## Agent behavior

The implementation uses an adaptive tool loop. It does not simply call every tool in a fixed sequence. The model can select additional evidence based on the shipment and user question, while the deterministic tools remain the numerical source of truth.

## Guardrails

The implementation validates final recommendations before they are accepted. Negotiation realism, risk conditions, reassignment requirements, return-load selection, and terminal recommendation behavior are handled as explicit constraints rather than relying solely on natural-language prompting.

## Mapping status

No Leaflet, OpenStreetMap, Google Maps, or map-provider dependency is required by the current implementation. Mapping is deliberately deferred.

## Relationship to docs

Read `docs/` first for the problem and architecture. Read this directory's implementation map next. Then inspect the application source. Use `docs/cumulative-build-prompt.md` as the canonical reconstruction specification.
