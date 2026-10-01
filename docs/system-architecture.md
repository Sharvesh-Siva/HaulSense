# HaulSense System Architecture

```text
+-----------------------+
|       FRONTEND        |
| Dashboard | Trip | Map|
+-----------+-----------+
            |
            v
+-----------------------+
|       API LAYER       |
+-----------+-----------+
            |
            v
+-----------------------+
|     HAULSENSE AGENT   |
| intent | tool routing |
| reasoning | response  |
+-----------+-----------+
            |
   +--------+--------+--------+--------+
   |                 |                 |
   v                 v                 v
Profitability   Negotiation       Trust Passport
   |                 |                 |
   +-----------------+-----------------+
                     |
                     v
             Return Trip Engine
                     |
                     v
                 DATA LAYER
```

## Frontend

React/Vite application with Tailwind CSS. Leaflet renders maps using OpenStreetMap tiles. The map layer is kept separate from financial decision logic.

## Agent Layer

The agent interprets requests, selects tools, supplies inputs, checks results, invokes additional tools when required, and explains the final recommendation.

## Tool Layer

Numerical calculations are deterministic. The language model should not invent financial outputs when a tool can calculate them.

## Data Layer

The prototype uses JSON demo data. Persistent storage can be introduced later for trips, drivers, vehicles and loads.

## Design Principle

**AI orchestrates; deterministic tools calculate.** This is central to HaulSense reliability and testability.
