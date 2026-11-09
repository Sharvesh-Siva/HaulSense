# HaulSense — Agentic Freight Decision Platform

HaulSense is an agentic AI decision platform designed for transport operators and fleet owners in India. Instead of making high-stakes dispatch choices based on fragmented phone calls and gut feeling, dispatchers ask the HaulSense Agent: **"Should we accept this shipment?"**

The agent works out what it needs to know, dynamically selects and calls deterministic logistics tools, evaluates the results, and delivers a definitive operational recommendation: **ACCEPT, ACCEPT + SECURE RETURN LOAD, NEGOTIATE, REASSIGN, WAIT, or REJECT**.

---

## 1. The Core Innovation: Complete Trip-Cycle Evaluation

Most freight evaluation tools only analyze the outbound leg in isolation. A haul that looks profitable on paper can wipe out all earnings if the truck is forced to return empty (deadhead).

HaulSense evaluates the **complete trip cycle** (outbound + empty return penalty vs. compatible return load gain) using exact formulas, diesel rates (₹92/L), toll costs, and driver allowances.

---

## 2. The Golden Rule: AI Decides, Code Calculates

- **AI Responsibilities**: Understanding goals, dynamic tool selection, observing factual tool results, adjusting plans, assessing trade-offs, and formulating the final operational verdict.
- **Deterministic Code Responsibilities**: All arithmetic, fuel costs, break-even calculations, margin percentages, haversine radii, and risk points are computed strictly in deterministic TypeScript code validated with Zod. The AI never calculates a rupee amount itself.

---

## 3. The 8 Agent Tools

1. `calculate_trip_profit`: Fuel cost, operating costs, profit, margin percentage, break-even freight.
2. `what_if_simulator`: Evaluates sensitivity under freight rate, fuel price, toll, or mileage adjustments.
3. `get_trust_passport`: Retrieves driver trust score (0–100), on-time rate, cancellations, incidents, and reliability signal.
4. `find_return_trip`: Searches compatible backhauls within geographic and timing bounds; calculates full roundtrip cycle economics.
5. `match_vehicle`: Matches available fleet vehicles based on payload capacity and cargo compatibility.
6. `simulate_negotiation`: Computes 10% floor and 20% target margins, counter-offers, and commercial reality (< 25% uplift).
7. `evaluate_risk`: Multidimensional point-based scoring (0–24 LOW, 25–49 MEDIUM, 50+ HIGH).
8. `submit_recommendation` (Terminal Tool): Submits the final operational commitment with 3–5 decisive factors and an immediate next directive. Enforces strict business guardrails.

---

## 4. Test Scenarios & Exact Mathematical Baselines

- **Golden Case (`S-GOLDEN`, Chennai → Bengaluru)**:
  - 7t FMCG, offered ₹25,000, 350 km.
  - Fuel: ₹8,050; Total Cost: ₹13,550; Profit: ₹11,450; Margin: 45.8%.
  - Empty return cost: ₹10,300; Outbound-only cycle net: ₹1,150.
  - Secured backhaul R1 net: ₹4,050; Trip-cycle profit: ₹15,500; Improvement: +₹14,350.
  - **Verdict**: `ACCEPT + SECURE RETURN LOAD`.

- **Case A (`S-CASE-A`, Chennai → Vellore)**:
  - 5t general, offered ₹12,000, 140 km.
  - Profit: ₹6,480 (54.0% margin). Short high-margin corridor.
  - **Verdict**: `ACCEPT`.

- **Case B (`S-CASE-B`, Chennai → Madurai)**:
  - 9t general, offered ₹21,000, 460 km.
  - Profit: ₹3,520 (16.8% margin; below 20% target).
  - Target counter-offer: ₹21,850 (+4.0% uplift; realistic).
  - **Verdict**: `NEGOTIATE ₹21,850`.

- **Case D (`S-CASE-D`, Chennai → Bengaluru Electronics)**:
  - High-value cargo, tight deadline slack (1.2h), driver DRV-002 with 54 trust score and 3 incidents.
  - Risk Level: HIGH (100 pts).
  - **Verdict**: `REASSIGN` to DRV-001 or DRV-003.

- **Case E (`S-CASE-E`, Chennai → Kochi)**:
  - 10t general, offered ₹24,000, 700 km.
  - Total cost: ₹26,900; Profit: -₹2,900 (-12.1% margin).
  - Counter-offer requires +40.2% price hike (>25% commercial limit).
  - **Verdict**: `REJECT`.

---

## 5. Getting Started & Running the Application

### Installation & Run

```bash
# Install dependencies
npm install

# Run the development server (Express backend + Vite frontend with SSE streaming)
npm run dev
```

Open your browser at `http://localhost:3000`.

### Credentials

- **Manager Workspace**: `manager@haulsense.in` / `haul123`
  - *(Shortcut: Click the top-left HaulSense hexagon emblem on the landing page for immediate preloaded manager access)*
- **Driver Portal**: Driver ID: `DRV-001`, PIN: `1234`
- **Diagnostics & Ground-Truth Test**: Navigate to `/diagnostics`
