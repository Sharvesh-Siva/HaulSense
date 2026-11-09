/**
 * Tool 7: evaluate_risk
 * Multidimensional risk assessment scoring driver reliability, schedule tightness,
 * cargo exposure, operational margins, and return haul stability.
 */

import { z } from 'zod';
import { AVERAGE_SPEED_KMH } from '../config';
import { EvaluateRiskOutput, RiskFactorItem, RiskLevel } from '../types';

export const EvaluateRiskSchema = z.object({
  purpose: z.string().min(1, 'Purpose is required'),
  driverReliabilityScore: z.number().min(0).max(100).optional(),
  driverOnTimePercentage: z.number().min(0).max(100).optional(),
  driverCancellationRate: z.number().min(0).max(100).optional(),
  driverIncidents: z.number().min(0).optional(),
  departureTime: z.string().min(1),
  deliveryDeadline: z.string().min(1),
  distanceKm: z.number().positive(),
  marginPercentage: z.number(),
  isHighValueCargo: z.boolean().optional().default(false),
  vehicleCapacityTons: z.number().positive().optional(),
  shipmentWeightTons: z.number().positive().optional(),
  returnLoadFoundButUnconfirmed: z.boolean().optional().default(false),
});

export function evaluateRisk(rawInput: unknown): EvaluateRiskOutput {
  const parseResult = EvaluateRiskSchema.safeParse(rawInput);
  if (!parseResult.success) {
    const errorMsg = parseResult.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    return {
      ok: false,
      error: `Validation error: ${errorMsg}`,
      score: 0,
      level: 'LOW',
      factors: [],
      warnings: [],
      mitigations: [],
      deadlineSlackHours: 0,
    };
  }

  const {
    driverReliabilityScore,
    driverOnTimePercentage,
    driverCancellationRate,
    driverIncidents,
    departureTime,
    deliveryDeadline,
    distanceKm,
    marginPercentage,
    isHighValueCargo,
    vehicleCapacityTons,
    shipmentWeightTons,
    returnLoadFoundButUnconfirmed,
  } = parseResult.data;

  const factors: RiskFactorItem[] = [];
  const warnings: string[] = [];
  const mitigations: string[] = [];

  // 1. Driver Reliability
  if (driverReliabilityScore !== undefined) {
    if (driverReliabilityScore < 60) {
      factors.push({
        code: 'DRIVER_CRITICAL_RELIABILITY',
        description: `Driver trust score (${driverReliabilityScore}/100) is below acceptable safety threshold`,
        points: 40,
      });
      warnings.push(`Assigned driver has a critical reliability score of ${driverReliabilityScore}/100.`);
      mitigations.push('Reassign shipment immediately to an available verified Tier-1 driver.');
    } else if (driverReliabilityScore <= 74) {
      factors.push({
        code: 'DRIVER_MODERATE_RELIABILITY',
        description: `Driver trust score (${driverReliabilityScore}/100) requires cautious monitoring`,
        points: 20,
      });
      warnings.push(`Driver reliability is moderate (${driverReliabilityScore}/100).`);
    }
  }

  if (driverOnTimePercentage !== undefined && driverOnTimePercentage < 70) {
    factors.push({
      code: 'DRIVER_ON_TIME_DEFICIT',
      description: `Historical on-time delivery rate is low (${driverOnTimePercentage}%)`,
      points: 15,
    });
    warnings.push(`Driver has poor on-time record (${driverOnTimePercentage}%).`);
  }

  if (driverCancellationRate !== undefined && driverCancellationRate > 10) {
    factors.push({
      code: 'DRIVER_HIGH_CANCELLATIONS',
      description: `Driver cancellation rate (${driverCancellationRate}%) exceeds 10% safety margin`,
      points: 10,
    });
  }

  if (driverIncidents !== undefined && driverIncidents >= 3) {
    factors.push({
      code: 'DRIVER_MULTIPLE_INCIDENTS',
      description: `Driver has recorded 3 or more safety or disciplinary incidents (${driverIncidents} incidents)`,
      points: 10,
    });
    warnings.push(`Driver has ${driverIncidents} recorded incidents.`);
  }

  // 2. Deadline Slack calculation
  // Deadline slack = deadline − (departure + distance ÷ 45 km/h)
  const transitHours = distanceKm / AVERAGE_SPEED_KMH;
  let deadlineSlackHours = 8; // fallback default
  try {
    const depTime = new Date(departureTime).getTime();
    const deadTime = new Date(deliveryDeadline).getTime();
    const availableHours = (deadTime - depTime) / (1000 * 3600);
    deadlineSlackHours = Number((availableHours - transitHours).toFixed(1));
  } catch {
    deadlineSlackHours = 8;
  }

  if (deadlineSlackHours < 4) {
    factors.push({
      code: 'TIGHT_DEADLINE_BUFFER',
      description: `Transit buffer is critically tight (${deadlineSlackHours} hours slack at 45 km/h)`,
      points: 15,
    });
    warnings.push(`Tight turnaround window: only ${deadlineSlackHours} hours of slack before delivery deadline.`);
    mitigations.push('Mandate departure at earliest slot and prioritize green corridor route.');
  }

  // 3. Margin risk
  if (marginPercentage < 10) {
    factors.push({
      code: 'SUB_FLOOR_MARGIN',
      description: `Trip operational margin (${marginPercentage}%) is below 10% floor`,
      points: 20,
    });
    warnings.push(`Trip margin is under the 10% floor threshold (${marginPercentage}%).`);
    mitigations.push('Negotiate freight increase or reject load unless secured return covers empty transit.');
  } else if (marginPercentage < 20) {
    factors.push({
      code: 'SUB_TARGET_MARGIN',
      description: `Trip margin (${marginPercentage}%) is below 20% target`,
      points: 10,
    });
  }

  // 4. Cargo value
  if (isHighValueCargo) {
    factors.push({
      code: 'HIGH_VALUE_EXPOSURE',
      description: 'Cargo categorized as high-value/pilferage-sensitive goods',
      points: 10,
    });
    mitigations.push('Assign only high-trust driver with zero incident record and lockable container truck.');
  }

  // 5. Vehicle capacity & utilization
  if (vehicleCapacityTons && shipmentWeightTons) {
    const utilPct = (shipmentWeightTons / vehicleCapacityTons) * 100;
    if (utilPct > 95) {
      factors.push({
        code: 'TIGHT_PAYLOAD_LIMIT',
        description: `Vehicle capacity utilization is exceptionally tight (${utilPct.toFixed(1)}%)`,
        points: 10,
      });
      warnings.push(`Vehicle payload is at ${utilPct.toFixed(1)}% of rated axle limits.`);
    } else if (utilPct < 40) {
      factors.push({
        code: 'OVERSIZED_VEHICLE',
        description: `Vehicle is oversized for this haul (${utilPct.toFixed(1)}% payload utilization)`,
        points: 5,
      });
    }
  }

  // 6. Return load status
  if (returnLoadFoundButUnconfirmed) {
    factors.push({
      code: 'UNCONFIRMED_RETURN_LOAD',
      description: 'Prospective return load identified but broker confirmation is pending',
      points: 5,
    });
    mitigations.push('Call consignor to confirm backhaul booking before outbound departure.');
  }

  // Total points
  const totalScore = factors.reduce((sum, f) => sum + f.points, 0);

  // Level classification: LOW is 0–24, MEDIUM 25–49, HIGH 50 or more
  let level: RiskLevel = 'LOW';
  if (totalScore >= 50) {
    level = 'HIGH';
  } else if (totalScore >= 25) {
    level = 'MEDIUM';
  }

  return {
    ok: true,
    score: totalScore,
    level,
    factors,
    warnings,
    mitigations,
    deadlineSlackHours,
  };
}
