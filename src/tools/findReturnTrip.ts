/**
 * Tool 4: find_return_trip
 * Evaluates return haul opportunities, calculates roundtrip trip-cycle profitability,
 * and provides transparent reasons for discarded loads.
 */

import { z } from 'zod';
import {
  DIESEL_PRICE_PER_LITRE,
  EMPTY_TRUCK_MILEAGE_MULTIPLIER,
  MAX_RETURN_DEST_RADIUS_KM,
  MAX_RETURN_ORIGIN_RADIUS_KM,
  MAX_RETURN_PICKUP_HOURS,
  RETURN_DRIVER_FIXED_COST,
} from '../config';
import { CITIES, RETURN_LOADS } from '../data/mockData';
import {
  CargoType,
  CompatibleReturnLoad,
  FindReturnTripOutput,
  RejectedReturnLoad,
} from '../types';
import { calculateHaversineDistanceKm, getHoursBetween } from '../utils';

export const FindReturnTripSchema = z.object({
  purpose: z.string().min(1, 'Purpose is required'),
  origin: z.string().min(1),
  destination: z.string().min(1),
  outboundDistanceKm: z.number().positive(),
  outboundMileage: z.number().positive().default(4.0),
  outboundProfit: z.number(),
  outboundToll: z.number().min(0).default(1800),
  arrivalTime: z.string(),
  truckCapacityTons: z.number().positive().default(10),
  supportedCargoTypes: z.array(z.string()).optional(),
});

export function findReturnTrip(rawInput: unknown): FindReturnTripOutput {
  const parseResult = FindReturnTripSchema.safeParse(rawInput);
  if (!parseResult.success) {
    const errorMsg = parseResult.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    return {
      ok: false,
      error: `Validation error: ${errorMsg}`,
      emptyReturnCost: 0,
      outboundOnlyCycleProfit: 0,
      compatibleLoads: [],
      rejectedLoads: [],
    };
  }

  const {
    origin,
    destination,
    outboundDistanceKm,
    outboundMileage,
    outboundProfit,
    outboundToll,
    arrivalTime,
    truckCapacityTons,
    supportedCargoTypes,
  } = parseResult.data;

  // 1. Calculate empty return cost
  // emptyReturnCost = distance ÷ (mileage × 1.15) × fuelPrice + toll + return driver cost (₹1,500)
  const emptyMileage = outboundMileage * EMPTY_TRUCK_MILEAGE_MULTIPLIER;
  const emptyFuelCost = Math.round((outboundDistanceKm / emptyMileage) * DIESEL_PRICE_PER_LITRE);
  const emptyReturnCost = Math.round(emptyFuelCost + outboundToll + RETURN_DRIVER_FIXED_COST);

  // outboundOnlyCycleProfit = outboundProfit − emptyReturnCost
  const outboundOnlyCycleProfit = Math.round(outboundProfit - emptyReturnCost);

  const outboundDestCoord = CITIES[destination] || { name: destination, lat: 0, lng: 0 };
  const outboundOriginCoord = CITIES[origin] || { name: origin, lat: 0, lng: 0 };

  const compatibleLoads: CompatibleReturnLoad[] = [];
  const rejectedLoads: RejectedReturnLoad[] = [];

  for (const load of RETURN_LOADS) {
    const reasons: string[] = [];

    // Check 1: Weight capacity
    if (load.weightTons > truckCapacityTons) {
      reasons.push(`Exceeds vehicle capacity (${load.weightTons} t vs ${truckCapacityTons} t limit)`);
    }

    // Check 2: Supported cargo types
    if (supportedCargoTypes && supportedCargoTypes.length > 0) {
      if (!supportedCargoTypes.includes(load.cargoType)) {
        reasons.push(`Cargo type '${load.cargoType}' not supported by vehicle specifications`);
      }
    }

    // Check 3: Origin proximity (must be within 50 km of outbound destination)
    const loadOriginCoord = CITIES[load.origin];
    if (loadOriginCoord && outboundDestCoord) {
      const originDist = calculateHaversineDistanceKm(
        outboundDestCoord.lat,
        outboundDestCoord.lng,
        loadOriginCoord.lat,
        loadOriginCoord.lng
      );
      if (originDist > MAX_RETURN_ORIGIN_RADIUS_KM) {
        reasons.push(
          `Pickup location ${load.origin} is ${originDist} km away from drop point (max allowed: ${MAX_RETURN_ORIGIN_RADIUS_KM} km)`
        );
      }
    }

    // Check 4: Destination proximity (must be within 80 km of outbound origin)
    const loadDestCoord = CITIES[load.destination];
    if (loadDestCoord && outboundOriginCoord) {
      const destDist = calculateHaversineDistanceKm(
        outboundOriginCoord.lat,
        outboundOriginCoord.lng,
        loadDestCoord.lat,
        loadDestCoord.lng
      );
      if (destDist > MAX_RETURN_DEST_RADIUS_KM) {
        reasons.push(
          `Delivery location ${load.destination} is ${destDist} km away from fleet home base ${origin} (max allowed: ${MAX_RETURN_DEST_RADIUS_KM} km)`
        );
      }
    }

    // Check 5: Pickup timing (pickup within 24 hours of arrival)
    const hoursSlack = getHoursBetween(arrivalTime, load.pickupTime);
    if (hoursSlack > MAX_RETURN_PICKUP_HOURS) {
      reasons.push(
        `Pickup timing (${hoursSlack.toFixed(1)} hrs after arrival) exceeds 24-hour turnaround threshold`
      );
    }

    if (reasons.length > 0) {
      rejectedLoads.push({
        load,
        reason: reasons.join('; '),
      });
      continue;
    }

    // Compatible Load Calculations:
    // returnNet = returnFreight − (distance ÷ mileage × fuelPrice + toll + driver + other)
    const returnFuel = Math.round((load.distanceKm / outboundMileage) * DIESEL_PRICE_PER_LITRE);
    const returnTotalCost = Math.round(returnFuel + load.tollCost + load.driverCost + load.otherCost);
    const returnNet = Math.round(load.offeredFreight - returnTotalCost);

    // tripCycleProfit = outboundProfit + returnNet
    const tripCycleProfit = Math.round(outboundProfit + returnNet);

    // improvementVsEmptyReturn = tripCycleProfit − outboundOnlyCycleProfit
    const improvementVsEmptyReturn = Math.round(tripCycleProfit - outboundOnlyCycleProfit);

    compatibleLoads.push({
      load,
      returnNet,
      tripCycleProfit,
      improvementVsEmptyReturn,
    });
  }

  // Sort compatible loads by improvement descending
  compatibleLoads.sort((a, b) => b.improvementVsEmptyReturn - a.improvementVsEmptyReturn);

  return {
    ok: true,
    emptyReturnCost,
    outboundOnlyCycleProfit,
    compatibleLoads,
    rejectedLoads,
    bestOpportunity: compatibleLoads[0],
  };
}
