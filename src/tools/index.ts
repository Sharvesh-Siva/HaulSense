/**
 * HaulSense - Central Tool Registry & Dispatcher
 */

import { calculateTripProfit } from './calculateTripProfit';
import { whatIfSimulator } from './whatIfSimulator';
import { getTrustPassport } from './getTrustPassport';
import { findReturnTrip } from './findReturnTrip';
import { matchVehicle } from './matchVehicle';
import { simulateNegotiation } from './simulateNegotiation';
import { evaluateRisk } from './evaluateRisk';
import { GuardrailValidationContext, submitRecommendation } from './submitRecommendation';

export * from './calculateTripProfit';
export * from './whatIfSimulator';
export * from './getTrustPassport';
export * from './findReturnTrip';
export * from './matchVehicle';
export * from './simulateNegotiation';
export * from './evaluateRisk';
export * from './submitRecommendation';
export * from './declarations';

export interface ToolExecutionResult {
  tool: string;
  summary: string;
  data: Record<string, unknown>;
  rawOutput: unknown;
}

export function executeToolByName(
  name: string,
  args: Record<string, unknown>,
  context?: GuardrailValidationContext
): ToolExecutionResult {
  switch (name) {
    case 'calculate_trip_profit': {
      const res = calculateTripProfit(args);
      const summary = res.ok
        ? `Profit: ₹${res.profit.toLocaleString('en-IN')} (Margin: ${res.marginPercentage}%), Break-even: ₹${res.breakEvenFreight.toLocaleString('en-IN')}`
        : `Calculation failed: ${res.error}`;
      return { tool: name, summary, data: res as unknown as Record<string, unknown>, rawOutput: res };
    }

    case 'what_if_simulator': {
      const res = whatIfSimulator(args);
      const summary = res.ok
        ? `Simulated profit: ₹${res.simulated.profit.toLocaleString('en-IN')} (${res.simulated.marginPercentage}%). ${res.verdict}`
        : `Simulation failed: ${res.error}`;
      return { tool: name, summary, data: res as unknown as Record<string, unknown>, rawOutput: res };
    }

    case 'get_trust_passport': {
      const res = getTrustPassport(args);
      let summary = '';
      if (res.ok) {
        if (res.singleDriver) {
          summary = `Driver ${res.singleDriver.name} (${res.singleDriver.driverId}): Score ${res.singleDriver.score}/100, Signal [${res.singleDriver.signal.toUpperCase()}]`;
        } else if (res.rankedDrivers) {
          summary = `Found ${res.rankedDrivers.length} available drivers. Top: ${res.rankedDrivers[0]?.name} (Score ${res.rankedDrivers[0]?.score})`;
        }
      } else {
        summary = `Driver query failed: ${res.error}`;
      }
      return { tool: name, summary, data: res as unknown as Record<string, unknown>, rawOutput: res };
    }

    case 'find_return_trip': {
      const res = findReturnTrip(args);
      let summary = '';
      if (res.ok) {
        if (res.bestOpportunity) {
          summary = `Identified return load ${res.bestOpportunity.load.id} (${res.bestOpportunity.load.origin} → ${res.bestOpportunity.load.destination}): +₹${res.bestOpportunity.improvementVsEmptyReturn.toLocaleString('en-IN')} cycle gain`;
        } else {
          summary = `No compatible return load found. Empty return costs ₹${res.emptyReturnCost.toLocaleString('en-IN')}.`;
        }
      } else {
        summary = `Return search failed: ${res.error}`;
      }
      return { tool: name, summary, data: res as unknown as Record<string, unknown>, rawOutput: res };
    }

    case 'match_vehicle': {
      const res = matchVehicle(args);
      const summary = res.ok
        ? res.bestVehicle
          ? `Matched vehicle ${res.bestVehicle.vehicle.id} (${res.bestVehicle.vehicle.plateNumber}): ${res.bestVehicle.utilizationPercentage}% payload [${res.bestVehicle.fitLabel.toUpperCase()}]`
          : 'No available fleet vehicle matches capacity and cargo requirements.'
        : `Vehicle matching failed: ${res.error}`;
      return { tool: name, summary, data: res as unknown as Record<string, unknown>, rawOutput: res };
    }

    case 'simulate_negotiation': {
      const res = simulateNegotiation(args);
      const summary = res.ok
        ? `Target counter-offer: ₹${res.counterOfferFreight.toLocaleString('en-IN')} (+${res.upliftPercentage}% uplift). Realistic: ${res.isRealistic ? 'YES' : 'NO'}`
        : `Negotiation simulation failed: ${res.error}`;
      return { tool: name, summary, data: res as unknown as Record<string, unknown>, rawOutput: res };
    }

    case 'evaluate_risk': {
      const res = evaluateRisk(args);
      const summary = res.ok
        ? `Risk score: ${res.score}/100 [${res.level}], Slack: ${res.deadlineSlackHours} hrs, Factors: ${res.factors.length}`
        : `Risk evaluation failed: ${res.error}`;
      return { tool: name, summary, data: res as unknown as Record<string, unknown>, rawOutput: res };
    }

    case 'submit_recommendation': {
      const res = submitRecommendation(args, context);
      const summary = res.accepted
        ? `Recommendation accepted: ${res.action}`
        : `Guardrail violation: ${res.replanReason}`;
      return { tool: name, summary, data: res as unknown as Record<string, unknown>, rawOutput: res };
    }

    default:
      return {
        tool: name,
        summary: `Unknown tool '${name}'`,
        data: { ok: false, error: `Tool '${name}' is not recognized.` },
        rawOutput: { ok: false, error: `Tool '${name}' is not recognized.` },
      };
  }
}
