/**
 * Tool 5: match_vehicle (Deterministic Vehicle Matching Engine)
 * Determines which vehicles are suitable for a shipment based on:
 * 1. Payload capacity
 * 2. Volume capacity
 * 3. Vehicle type
 * 4. Body type
 * 5. Cargo compatibility
 * 6. Temperature requirement
 * 7. Current location
 * 8. Availability
 * 9. Maintenance / Health status
 * 10. Route suitability
 *
 * Produces an explainable, deterministic match score (0–100%) and checklist.
 */

import { z } from 'zod';
import { DRIVERS, VEHICLES } from '../data/mockData';
import {
  LoadRequirement,
  MatchFactorItem,
  MatchVehicleOutput,
  Vehicle,
  VehicleFitLabel,
  VehicleMatchItem,
} from '../types';

export const MatchVehicleSchema = z.object({
  purpose: z.string().min(1, 'Purpose is required'),
  weightTons: z.number().positive().optional(),
  cargoType: z.string().optional(),
  departureCity: z.string().optional().default('Chennai'),
  requirements: z
    .object({
      cargoType: z.string(),
      cargoWeightTons: z.number().positive(),
      cargoVolumeM3: z.number().positive(),
      requiredVehicleType: z.string(),
      requiredBodyType: z.string(),
      temperatureRequirement: z.enum(['ambient', 'chilled', 'frozen']).default('ambient'),
      specialHandling: z.string().default('none'),
    })
    .optional(),
});

export function evaluateVehicleForLoad(
  vehicle: Vehicle,
  req: LoadRequirement,
  departureCity = 'Chennai'
): VehicleMatchItem {
  const factors: MatchFactorItem[] = [];
  const reasons: string[] = [];
  const mismatchReasons: string[] = [];

  // Factor 1: Payload Capacity (Weight: 25 points)
  const payloadPass = vehicle.capacityTons >= req.cargoWeightTons;
  const payloadUtilization = Number(((req.cargoWeightTons / vehicle.capacityTons) * 100).toFixed(1));
  let payloadScore = 0;
  if (payloadPass) {
    if (payloadUtilization >= 60 && payloadUtilization <= 95) {
      payloadScore = 25;
      reasons.push(`Payload sufficient (${req.cargoWeightTons}T fits ${vehicle.capacityTons}T capacity at ${payloadUtilization}% utilization)`);
    } else if (payloadUtilization < 60) {
      payloadScore = 18;
      reasons.push(`Payload sufficient but vehicle oversized (${payloadUtilization}% utilization)`);
    } else {
      payloadScore = 20;
      reasons.push(`Payload fits tightly at ${payloadUtilization}% capacity`);
    }
  } else {
    payloadScore = 0;
    mismatchReasons.push(`Payload capacity insufficient: needs ${req.cargoWeightTons}T, vehicle is ${vehicle.capacityTons}T`);
  }
  factors.push({
    name: 'Payload Capacity',
    pass: payloadPass,
    weight: 25,
    score: payloadScore,
    message: payloadPass ? 'Capacity sufficient' : 'Overweight for vehicle',
  });

  // Factor 2: Volume Capacity (Weight: 15 points)
  const volumePass = vehicle.volumeCapacityM3 >= req.cargoVolumeM3;
  const volumeUtilization = Number(((req.cargoVolumeM3 / vehicle.volumeCapacityM3) * 100).toFixed(1));
  const volumeScore = volumePass ? 15 : 0;
  if (volumePass) {
    reasons.push(`Volume sufficient (${req.cargoVolumeM3} m³ fits ${vehicle.volumeCapacityM3} m³ hold)`);
  } else {
    mismatchReasons.push(`Volume capacity exceeded: needs ${req.cargoVolumeM3} m³, vehicle has ${vehicle.volumeCapacityM3} m³`);
  }
  factors.push({
    name: 'Volume Capacity',
    pass: volumePass,
    weight: 15,
    score: volumeScore,
    message: volumePass ? 'Hold volume fits payload' : 'Volume capacity insufficient',
  });

  // Factor 3: Body Type Compatibility (Weight: 15 points)
  const bodyPass =
    vehicle.bodyType === req.requiredBodyType ||
    (req.requiredBodyType === 'Closed Container' && vehicle.bodyType === 'Closed Container') ||
    (req.requiredBodyType === 'Open' && (vehicle.bodyType === 'Open' || vehicle.bodyType === 'Tarpaulin Covered'));
  const bodyScore = bodyPass ? 15 : 0;
  if (bodyPass) {
    reasons.push(`Body type compatible (${vehicle.bodyType})`);
  } else {
    mismatchReasons.push(`Body type mismatch: requires ${req.requiredBodyType}, vehicle is ${vehicle.bodyType}`);
  }
  factors.push({
    name: 'Body Type',
    pass: bodyPass,
    weight: 15,
    score: bodyScore,
    message: bodyPass ? `Body type compatible: ${vehicle.bodyType}` : `Requires ${req.requiredBodyType}`,
  });

  // Factor 4: Cargo Compatibility (Weight: 10 points)
  const cargoPass = vehicle.supportedCargo.includes(req.cargoType as any);
  const cargoScore = cargoPass ? 10 : 0;
  if (cargoPass) {
    reasons.push(`Cargo supported: ${req.cargoType}`);
  } else {
    mismatchReasons.push(`Cargo type '${req.cargoType}' not listed in vehicle specification`);
  }
  factors.push({
    name: 'Cargo Compatibility',
    pass: cargoPass,
    weight: 10,
    score: cargoScore,
    message: cargoPass ? 'Cargo class allowed' : 'Cargo class unsupported',
  });

  // Factor 5: Temperature Requirement (Weight: 10 points)
  let tempPass = true;
  let tempScore = 10;
  if (req.temperatureRequirement !== 'ambient') {
    tempPass = vehicle.refrigerationCapability;
    tempScore = tempPass ? 10 : 0;
    if (tempPass) {
      reasons.push(`Refrigeration unit verified for ${req.temperatureRequirement} temperature`);
    } else {
      mismatchReasons.push(`Refrigeration required (${req.temperatureRequirement}) but vehicle is non-reefer`);
    }
  } else {
    reasons.push('Ambient cargo temperature compatible');
  }
  factors.push({
    name: 'Temperature Control',
    pass: tempPass,
    weight: 10,
    score: tempScore,
    message: tempPass ? 'Temperature verified' : 'No refrigeration unit',
  });

  // Factor 6: Availability Status (Weight: 10 points)
  const availPass = vehicle.status === 'available';
  const availScore = availPass ? 10 : 0;
  if (availPass) {
    reasons.push('Vehicle available immediately at fleet yard');
  } else {
    mismatchReasons.push(`Vehicle currently ${vehicle.status.replace('_', ' ')}`);
  }
  factors.push({
    name: 'Fleet Availability',
    pass: availPass,
    weight: 10,
    score: availScore,
    message: availPass ? 'Vehicle idle & available' : `Vehicle ${vehicle.status}`,
  });

  // Factor 7: Maintenance & Vehicle Health (Weight: 10 points)
  const healthPass = vehicle.health.overallScore >= 75 && vehicle.status !== 'in_maintenance';
  let healthScore = 0;
  if (healthPass) {
    healthScore = Math.round((vehicle.health.overallScore / 100) * 10);
    reasons.push(`Vehicle health verified at ${vehicle.health.overallScore}%`);
  } else {
    healthScore = Math.round((vehicle.health.overallScore / 100) * 5);
    mismatchReasons.push(`Vehicle health sub-par (${vehicle.health.overallScore}%) or maintenance required`);
  }
  factors.push({
    name: 'Vehicle Health & Maintenance',
    pass: healthPass,
    weight: 10,
    score: healthScore,
    message: `Health score: ${vehicle.health.overallScore}%`,
  });

  // Factor 8: Location & Route Suitability (Weight: 5 points)
  const locPass = vehicle.currentLocation === departureCity;
  const locScore = locPass ? 5 : 0;
  if (locPass) {
    reasons.push(`Located at origin hub (${vehicle.currentLocation})`);
  } else {
    mismatchReasons.push(`Stationed at ${vehicle.currentLocation}, transit required to ${departureCity}`);
  }
  factors.push({
    name: 'Route & Station Suitability',
    pass: locPass,
    weight: 5,
    score: locScore,
    message: locPass ? `Stationed at ${departureCity}` : `Stationed at ${vehicle.currentLocation}`,
  });

  const totalScore = factors.reduce((sum, f) => sum + f.score, 0);

  // Overall suitability: requires payload, body, cargo, and availability
  const isSuitable = payloadPass && bodyPass && cargoPass && tempPass && availPass;

  let fitLabel: VehicleFitLabel = 'unsuitable';
  if (!isSuitable) {
    fitLabel = 'unsuitable';
  } else if (payloadUtilization >= 60 && payloadUtilization <= 95) {
    fitLabel = 'ideal';
  } else if (payloadUtilization >= 40 && payloadUtilization < 60) {
    fitLabel = 'acceptable';
  } else if (payloadUtilization > 95) {
    fitLabel = 'tight';
  } else {
    fitLabel = 'oversized';
  }

  const driver = vehicle.driverId ? DRIVERS.find((d) => d.id === vehicle.driverId) : undefined;

  return {
    vehicle,
    matchScore: totalScore,
    fitLabel,
    utilizationPercentage: payloadUtilization,
    volumeUtilizationPercentage: volumeUtilization,
    isSuitable,
    reasons,
    mismatchReasons,
    driver,
    factors,
  };
}

export function matchVehicle(rawInput: unknown): MatchVehicleOutput {
  const parseResult = MatchVehicleSchema.safeParse(rawInput);
  if (!parseResult.success) {
    const errorMsg = parseResult.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    return {
      ok: false,
      error: `Validation error: ${errorMsg}`,
      matches: [],
      hasSuitableMatch: false,
    };
  }

  const { weightTons, cargoType, departureCity, requirements } = parseResult.data;

  // Build standard requirement profile
  const effectiveReq: LoadRequirement = requirements
    ? {
        cargoType: requirements.cargoType as any,
        cargoWeightTons: requirements.cargoWeightTons,
        cargoVolumeM3: requirements.cargoVolumeM3,
        requiredVehicleType: requirements.requiredVehicleType as any,
        requiredBodyType: requirements.requiredBodyType as any,
        temperatureRequirement: requirements.temperatureRequirement,
        specialHandling: requirements.specialHandling as any,
      }
    : {
        cargoType: (cargoType as any) || 'fmcg',
        cargoWeightTons: weightTons || 6.2,
        cargoVolumeM3: (weightTons || 6.2) * 3.5,
        requiredVehicleType: (weightTons || 6.2) > 10 ? 'Heavy Truck' : 'Medium Truck',
        requiredBodyType: 'Closed Container',
        temperatureRequirement: 'ambient',
        specialHandling: 'none',
      };

  const matches = VEHICLES.map((v) => evaluateVehicleForLoad(v, effectiveReq, departureCity));

  // Sort: highest matchScore first
  matches.sort((a, b) => b.matchScore - a.matchScore);

  return {
    ok: true,
    matches,
    bestVehicle: matches[0],
    hasSuitableMatch: matches.some((m) => m.isSuitable),
  };
}
