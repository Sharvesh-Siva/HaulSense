/**
 * Tool 2: what_if_simulator
 * Evaluates operational sensitivity by simulating changes in freight, diesel price, tolls, or mileage.
 */

import { z } from 'zod';
import { WhatIfSimulatorOutput } from '../types';
import { calculateTripProfit } from './calculateTripProfit';

export const WhatIfSimulatorSchema = z.object({
  purpose: z.string().min(1, 'Purpose is required'),
  baseline: z.object({
    distanceKm: z.number().positive(),
    mileageKmPerLitre: z.number().positive(),
    fuelPricePerLitre: z.number().positive(),
    offeredFreight: z.number().positive(),
    tollCost: z.number().min(0).default(0),
    driverCost: z.number().min(0).default(0),
    otherCost: z.number().min(0).default(0),
  }),
  adjustments: z.object({
    freightChangeAbsolute: z.number().optional(),
    freightChangePercent: z.number().optional(),
    fuelPriceAbsolute: z.number().positive().optional(),
    tollChangeAbsolute: z.number().optional(),
    driverCostAbsolute: z.number().optional(),
    mileageKmPerLitre: z.number().positive().optional(),
  }),
});

export function whatIfSimulator(rawInput: unknown): WhatIfSimulatorOutput {
  const parseResult = WhatIfSimulatorSchema.safeParse(rawInput);
  if (!parseResult.success) {
    const errorMsg = parseResult.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    return {
      ok: false,
      error: `Validation error: ${errorMsg}`,
      baseline: { revenue: 0, cost: 0, profit: 0, marginPercentage: 0 },
      simulated: { revenue: 0, cost: 0, profit: 0, marginPercentage: 0 },
      deltaProfit: 0,
      deltaMarginPercentage: 0,
      verdict: 'Simulation failed due to input validation error.',
    };
  }

  const { baseline, adjustments } = parseResult.data;

  // Calculate baseline profit
  const baseResult = calculateTripProfit({
    purpose: 'Calculate baseline profit for simulation',
    distanceKm: baseline.distanceKm,
    mileageKmPerLitre: baseline.mileageKmPerLitre,
    fuelPricePerLitre: baseline.fuelPricePerLitre,
    offeredFreight: baseline.offeredFreight,
    tollCost: baseline.tollCost,
    driverCost: baseline.driverCost,
    otherCost: baseline.otherCost,
  });

  if (!baseResult.ok) {
    return {
      ok: false,
      error: baseResult.error,
      baseline: { revenue: 0, cost: 0, profit: 0, marginPercentage: 0 },
      simulated: { revenue: 0, cost: 0, profit: 0, marginPercentage: 0 },
      deltaProfit: 0,
      deltaMarginPercentage: 0,
      verdict: 'Baseline calculation failed.',
    };
  }

  // Apply adjustments
  let simulatedFreight = baseline.offeredFreight;
  if (adjustments.freightChangeAbsolute !== undefined) {
    simulatedFreight += adjustments.freightChangeAbsolute;
  }
  if (adjustments.freightChangePercent !== undefined) {
    simulatedFreight += baseline.offeredFreight * (adjustments.freightChangePercent / 100);
  }

  const simulatedFuelPrice = adjustments.fuelPriceAbsolute ?? baseline.fuelPricePerLitre;
  const simulatedMileage = adjustments.mileageKmPerLitre ?? baseline.mileageKmPerLitre;
  const simulatedToll = baseline.tollCost + (adjustments.tollChangeAbsolute ?? 0);
  const simulatedDriver = adjustments.driverCostAbsolute ?? baseline.driverCost;

  const simResult = calculateTripProfit({
    purpose: 'Calculate simulated scenario profit',
    distanceKm: baseline.distanceKm,
    mileageKmPerLitre: simulatedMileage,
    fuelPricePerLitre: simulatedFuelPrice,
    offeredFreight: Math.max(1, simulatedFreight),
    tollCost: Math.max(0, simulatedToll),
    driverCost: Math.max(0, simulatedDriver),
    otherCost: baseline.otherCost,
  });

  if (!simResult.ok) {
    return {
      ok: false,
      error: simResult.error,
      baseline: {
        revenue: baseResult.offeredFreight,
        cost: baseResult.totalCost,
        profit: baseResult.profit,
        marginPercentage: baseResult.marginPercentage,
      },
      simulated: { revenue: 0, cost: 0, profit: 0, marginPercentage: 0 },
      deltaProfit: 0,
      deltaMarginPercentage: 0,
      verdict: 'Simulated parameters caused invalid trip calculation.',
    };
  }

  const deltaProfit = simResult.profit - baseResult.profit;
  const deltaMarginPercentage = Number((simResult.marginPercentage - baseResult.marginPercentage).toFixed(1));

  let verdict = '';
  if (simResult.profit < 0) {
    verdict = `Critical risk: Scenario produces a loss of ₹${Math.abs(simResult.profit).toLocaleString('en-IN')}.`;
  } else if (simResult.marginPercentage >= 20) {
    verdict = `Healthy outcome: Margin reaches ${simResult.marginPercentage}% (meets target).`;
  } else if (simResult.marginPercentage >= 10) {
    verdict = `Acceptable outcome: Margin at ${simResult.marginPercentage}%, above 10% floor.`;
  } else {
    verdict = `Weak outcome: Margin at ${simResult.marginPercentage}%, below 10% floor.`;
  }

  return {
    ok: true,
    baseline: {
      revenue: baseResult.offeredFreight,
      cost: baseResult.totalCost,
      profit: baseResult.profit,
      marginPercentage: baseResult.marginPercentage,
    },
    simulated: {
      revenue: simResult.offeredFreight,
      cost: simResult.totalCost,
      profit: simResult.profit,
      marginPercentage: simResult.marginPercentage,
    },
    deltaProfit,
    deltaMarginPercentage,
    verdict,
  };
}
