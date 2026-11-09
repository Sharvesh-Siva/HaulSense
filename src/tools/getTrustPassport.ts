/**
 * Tool 3: get_trust_passport
 * Retrieves driver behavioral integrity, safety history, and reliability signals.
 */

import { z } from 'zod';
import { DRIVERS } from '../data/mockData';
import { Driver, DriverSignal, GetTrustPassportOutput, TrustPassportData } from '../types';

export const GetTrustPassportSchema = z.object({
  purpose: z.string().min(1, 'Purpose is required'),
  driverId: z.string().optional(),
});

export function evaluateDriverSignal(driver: Driver): DriverSignal {
  if (driver.reliabilityScore < 65 || driver.incidentsCount >= 3) {
    return 'unreliable';
  }
  if (
    driver.reliabilityScore >= 80 &&
    driver.onTimePercentage >= 85 &&
    driver.cancellationRatePercentage <= 5
  ) {
    return 'reliable';
  }
  return 'caution';
}

function formatDriverPassport(driver: Driver): TrustPassportData {
  const signal = evaluateDriverSignal(driver);
  let summary = '';
  if (signal === 'reliable') {
    summary = `High performer with ${driver.reliabilityScore}/100 trust score, ${driver.onTimePercentage}% on-time, and zero severe incidents.`;
  } else if (signal === 'caution') {
    summary = `Moderate risk profile (${driver.reliabilityScore}/100 score). Monitoring advised for high-value freight.`;
  } else {
    summary = `Unfavorable profile (${driver.reliabilityScore}/100 score, ${driver.incidentsCount} safety incidents, ${driver.cancellationRatePercentage}% cancellations). Not recommended for critical hauls.`;
  }

  return {
    driverId: driver.id,
    name: driver.name,
    score: driver.reliabilityScore,
    onTimePercentage: driver.onTimePercentage,
    cancellationRatePercentage: driver.cancellationRatePercentage,
    incidentsCount: driver.incidentsCount,
    rating: driver.rating,
    experienceYears: driver.experienceYears,
    totalTripsCompleted: driver.totalTripsCompleted,
    signal,
    status: driver.status,
    summary,
  };
}

export function getTrustPassport(rawInput: unknown): GetTrustPassportOutput {
  const parseResult = GetTrustPassportSchema.safeParse(rawInput);
  if (!parseResult.success) {
    const errorMsg = parseResult.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    return {
      ok: false,
      error: `Validation error: ${errorMsg}`,
    };
  }

  const { driverId } = parseResult.data;

  if (driverId && driverId.trim().length > 0) {
    const driver = DRIVERS.find((d) => d.id === driverId.trim());
    if (!driver) {
      return {
        ok: false,
        error: `Driver '${driverId}' not found in registry.`,
      };
    }

    return {
      ok: true,
      singleDriver: formatDriverPassport(driver),
    };
  }

  // Return available drivers ranked by reliability score descending
  const ranked = DRIVERS
    .filter((d) => d.status === 'available')
    .sort((a, b) => b.reliabilityScore - a.reliabilityScore)
    .map(formatDriverPassport);

  return {
    ok: true,
    rankedDrivers: ranked,
  };
}
