# HaulSense — AI Studio Implementation Source

This directory contains the implementation exported from the HaulSense AI Studio application.

## Runtime

- React 19 + Vite
- Express
- TypeScript
- Gemini API via `@google/genai`
- Zod
- Recharts
- Motion
- React Router

## Implementation layers

```text
React application
    ↓
Context / Pages / Components
    ↓
Agent client stream
    ↓
Express server
    ↓
Gemini agent orchestrator
    ↓
Deterministic logistics tools
    ↓
Mock logistics data
```

## Agent capabilities

- calculate trip profit
- what-if simulation
- negotiation simulation
- return-trip analysis
- risk evaluation
- vehicle matching
- trust passport
- terminal recommendation

## Scope decision

This implementation does **not** depend on Leaflet, OpenStreetMap, Google Maps, or a mapping API. Mapping is deferred. The current implementation focuses on the agentic decision workflow and deterministic logistics intelligence.

## Configuration

Use the exported `.env.example` as the configuration reference. Never commit a real Gemini API key.

## Relationship to repository documentation

Read `../../docs/repository-roadmap.md` first. The documentation explains the problem, conceptual architecture, tool contracts, validation cases, and cumulative build specification. This directory is the concrete application source corresponding to that specification.
