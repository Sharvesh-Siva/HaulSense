/**
 * Tool 8: submit_recommendation (Terminal Tool)
 * Final operational commitment formulated by the HaulSense agent, validated against strict business guardrails.
 */

import { z } from 'zod';
import { ActionType, SubmitRecommendationInput, SubmitRecommendationOutput } from '../types';

export const SubmitRecommendationSchema = z.object({
  purpose: z.string().min(1, 'Purpose is required'),
  action: z.enum([
    'ACCEPT',
    'ACCEPT + SECURE RETURN LOAD',
    'NEGOTIATE',
    'REASSIGN',
    'WAIT',
    'REJECT',
  ]),
  reasoning: z.string().min(10, 'Reasoning must be clear and justified'),
  decisionFactors: z.array(z.string()).min(2, 'Provide at least 2 decision factors'),
  nextAction: z.string().min(5, 'Specific next operational step required'),
  assignedDriverId: z.string().optional(),
  assignedVehicleId: z.string().optional(),
  selectedReturnLoadId: z.string().optional(),
  recommendedFreight: z.number().optional(),
});

export interface GuardrailValidationContext {
  profitCalculated: boolean;
  marginPercentage?: number;
  riskEvaluated: boolean;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  driverReliability?: number;
  returnTripSearched: boolean;
  returnTripHasPositiveImprovement: boolean;
  rankedDriversFetched: boolean;
  replacementDriverFound: boolean;
  replacementDriverScore?: number;
  negotiationSimulated: boolean;
  negotiationRealistic?: boolean;
}

export function validateRecommendationGuardrails(
  action: ActionType,
  context: GuardrailValidationContext
): { valid: boolean; violationReason?: string; fallbackAction?: ActionType } {
  // 1. ACCEPT guardrails
  if (action === 'ACCEPT') {
    if (!context.profitCalculated) {
      return {
        valid: false,
        violationReason: 'ACCEPT is not allowed before calculating trip profitability.',
        fallbackAction: 'WAIT',
      };
    }
    if (context.marginPercentage !== undefined && context.marginPercentage < 10 && !context.returnTripHasPositiveImprovement) {
      return {
        valid: false,
        violationReason: `Trip margin (${context.marginPercentage}%) is below the 10% floor and no profitable return load was identified to recover empty return.`,
        fallbackAction: 'REJECT',
      };
    }
    if (context.riskLevel === 'HIGH') {
      return {
        valid: false,
        violationReason: 'ACCEPT is prohibited when overall trip risk is assessed as HIGH.',
        fallbackAction: 'REJECT',
      };
    }
    if (context.driverReliability !== undefined && context.driverReliability < 70) {
      return {
        valid: false,
        violationReason: `Assigned driver reliability (${context.driverReliability}/100) is below the 70 threshold required for direct acceptance.`,
        fallbackAction: 'REASSIGN',
      };
    }
  }

  // 2. ACCEPT + SECURE RETURN LOAD guardrails
  if (action === 'ACCEPT + SECURE RETURN LOAD') {
    if (!context.returnTripSearched || !context.returnTripHasPositiveImprovement) {
      return {
        valid: false,
        violationReason: '"ACCEPT + SECURE RETURN LOAD" requires a return trip search confirming a compatible return load with positive cycle improvement.',
        fallbackAction: 'WAIT',
      };
    }
  }

  // 3. REASSIGN guardrails
  if (action === 'REASSIGN') {
    if (!context.rankedDriversFetched || !context.replacementDriverFound || (context.replacementDriverScore !== undefined && context.replacementDriverScore < 80)) {
      return {
        valid: false,
        violationReason: 'REASSIGN requires fetching the ranked available driver list and nominating an available driver with a trust score of 80 or higher.',
        fallbackAction: 'WAIT',
      };
    }
  }

  // 4. NEGOTIATE guardrails
  if (action === 'NEGOTIATE') {
    if (!context.negotiationSimulated) {
      return {
        valid: false,
        violationReason: 'NEGOTIATE requires calling simulate_negotiation to verify a mathematically grounded target price.',
        fallbackAction: 'WAIT',
      };
    }
    if (context.negotiationRealistic === false) {
      return {
        valid: false,
        violationReason: 'Required rate counter-offer exceeds the 25% commercial feasibility limit. Action must be REJECT.',
        fallbackAction: 'REJECT',
      };
    }
  }

  // 5. REJECT guardrails
  if (action === 'REJECT') {
    if (!context.profitCalculated) {
      return {
        valid: false,
        violationReason: 'REJECT requires trip profitability to be calculated first to justify financial infeasibility.',
        fallbackAction: 'WAIT',
      };
    }
  }

  return { valid: true };
}

export function submitRecommendation(
  rawInput: unknown,
  context?: GuardrailValidationContext
): SubmitRecommendationOutput {
  const parseResult = SubmitRecommendationSchema.safeParse(rawInput);
  if (!parseResult.success) {
    const errorMsg = parseResult.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    return {
      ok: false,
      accepted: false,
      action: 'WAIT',
      reasoning: `Recommendation schema validation failed: ${errorMsg}`,
      decisionFactors: ['Schema error in agent submission'],
      nextAction: 'Re-call submit_recommendation with valid schema parameters.',
      replanRequired: true,
      replanReason: errorMsg,
    };
  }

  const data = parseResult.data;

  // Check guardrails if context is provided
  if (context) {
    const guardrailCheck = validateRecommendationGuardrails(data.action as ActionType, context);
    if (!guardrailCheck.valid) {
      return {
        ok: true,
        accepted: false,
        action: data.action as ActionType,
        reasoning: data.reasoning,
        decisionFactors: data.decisionFactors,
        nextAction: data.nextAction,
        assignedDriverId: data.assignedDriverId,
        assignedVehicleId: data.assignedVehicleId,
        selectedReturnLoadId: data.selectedReturnLoadId,
        recommendedFreight: data.recommendedFreight,
        replanRequired: true,
        replanReason: guardrailCheck.violationReason,
      };
    }
  }

  return {
    ok: true,
    accepted: true,
    action: data.action as ActionType,
    reasoning: data.reasoning,
    decisionFactors: data.decisionFactors,
    nextAction: data.nextAction,
    assignedDriverId: data.assignedDriverId,
    assignedVehicleId: data.assignedVehicleId,
    selectedReturnLoadId: data.selectedReturnLoadId,
    recommendedFreight: data.recommendedFreight,
  };
}
