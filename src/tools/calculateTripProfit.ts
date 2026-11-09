/**
 * Tool 1: calculate_trip_profit
 * Computes deterministic trip economics: fuel cost, operating cost, net profit, margin, and break-even.
 */

import { z } from 'zod';
import { DIESEL_PRICE_PER_LITRE } from '../config';
import { CalculateTripProfitInput, CalculateTripProfitOutput } from '../types';

export const CalculateTripProfitSchema = z.object({
  purpose: z.string().min(1, 'Purpose is required'),
  distanceKm: z.number().positive('Distance must be positive'),
  mileageKmPerLitre: z.number().positive('Mileage must be positive'),
  fuelPricePerLitre: z.number().positive().optional().default(DIESEL_PRICE_PER_LITRE),
  offeredFreight: z.number().positive('Offered freight must be positive'),
  tollCost: z.number().min(0, 'Toll cost cannot be negative').default(0),
  driverCost: z.number().min(0, 'Driver cost cannot be negative').default(0),
  otherCost: z.number().min(0, 'Other cost cannot be negative').default(0),
});

export function calculateTripProfit(rawInput: unknown): CalculateTripProfitOutput {
  const parseResult = CalculateTripProfitSchema.safeParse(rawInput);
  if (!parseResult.success) {
    const errorMsg = parseResult.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    return {
      ok: false,
      error: `Validation error: ${errorMsg}`,
      fuelCost: 0,
      totalCost: 0,
      profit: 0,
      marginPercentage: 0,
      breakEvenFreight: 0,
      offeredFreight: 0,
    };
  }

  const { distanceKm, mileageKmPerLitre, fuelPricePerLitre, offeredFreight, tollCost, driverCost, otherCost } =
    parseResult.data;

  if (mileageKmPerLitre <= 0 || offeredFreight <= 0) {
    return {
      ok: false,
      error: 'Invalid input: mileage and freight must be greater than zero.',
      fuelCost: 0,
      totalCost: 0,
      profit: 0,
      marginPercentage: 0,
      breakEvenFreight: 0,
      offeredFreight: 0,
    };
  }

  const fuelCost = Math.round((distanceKm / mileageKmPerLitre) * fuelPricePerLitre);
  const totalCost = Math.round(fuelCost + tollCost + driverCost + otherCost);
  const profit = Math.round(offeredFreight - totalCost);
  const marginPercentage = Number(((profit / offeredFreight) * 100).toFixed(1));
  const breakEvenFreight = totalCost;

  return {
    ok: true,
    fuelCost,
    totalCost,
    profit,
    marginPercentage,
    breakEvenFreight,
    offeredFreight: Math.round(offeredFreight),
  };
}
