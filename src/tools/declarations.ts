/**
 * HaulSense - Function Declarations for Gemini Function Calling (@google/genai)
 */

import { FunctionDeclaration, Type } from '@google/genai';

export const calculateTripProfitDeclaration: FunctionDeclaration = {
  name: 'calculate_trip_profit',
  description:
    'Calculates trip fuel cost, operating expenses, profit, margin percentage, and break-even freight using exact deterministic formulas. Call this first for every shipment.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      purpose: {
        type: Type.STRING,
        description: 'One short public sentence explaining why this tool is being invoked.',
      },
      distanceKm: {
        type: Type.NUMBER,
        description: 'Trip one-way distance in kilometers.',
      },
      mileageKmPerLitre: {
        type: Type.NUMBER,
        description: 'Truck fuel efficiency in km per litre (typically 4.0).',
      },
      fuelPricePerLitre: {
        type: Type.NUMBER,
        description: 'Diesel price per litre (default ₹92).',
      },
      offeredFreight: {
        type: Type.NUMBER,
        description: 'Gross freight payment offered by consignor in INR.',
      },
      tollCost: {
        type: Type.NUMBER,
        description: 'Toll plaza charges for the route in INR.',
      },
      driverCost: {
        type: Type.NUMBER,
        description: 'Driver wage and trip allowance in INR.',
      },
      otherCost: {
        type: Type.NUMBER,
        description: 'Loading/unloading and incidentals in INR.',
      },
    },
    required: ['purpose', 'distanceKm', 'mileageKmPerLitre', 'offeredFreight', 'tollCost', 'driverCost', 'otherCost'],
  },
};

export const whatIfSimulatorDeclaration: FunctionDeclaration = {
  name: 'what_if_simulator',
  description:
    'Simulates trip sensitivity under hypothetical variations in freight rate, diesel price, tolls, or mileage.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      purpose: {
        type: Type.STRING,
        description: 'One short public sentence explaining why this tool is being invoked.',
      },
      baseline: {
        type: Type.OBJECT,
        description: 'Baseline trip economics parameters.',
        properties: {
          distanceKm: { type: Type.NUMBER },
          mileageKmPerLitre: { type: Type.NUMBER },
          fuelPricePerLitre: { type: Type.NUMBER },
          offeredFreight: { type: Type.NUMBER },
          tollCost: { type: Type.NUMBER },
          driverCost: { type: Type.NUMBER },
          otherCost: { type: Type.NUMBER },
        },
        required: ['distanceKm', 'mileageKmPerLitre', 'fuelPricePerLitre', 'offeredFreight', 'tollCost', 'driverCost', 'otherCost'],
      },
      adjustments: {
        type: Type.OBJECT,
        description: 'Simulated variations.',
        properties: {
          freightChangeAbsolute: { type: Type.NUMBER },
          freightChangePercent: { type: Type.NUMBER },
          fuelPriceAbsolute: { type: Type.NUMBER },
          tollChangeAbsolute: { type: Type.NUMBER },
          driverCostAbsolute: { type: Type.NUMBER },
          mileageKmPerLitre: { type: Type.NUMBER },
        },
      },
    },
    required: ['purpose', 'baseline', 'adjustments'],
  },
};

export const getTrustPassportDeclaration: FunctionDeclaration = {
  name: 'get_trust_passport',
  description:
    'Retrieves driver trust score, on-time percentage, incident history, and safety signal. Call with driverId to inspect a specific driver, or leave empty to get a ranked list of available replacement drivers.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      purpose: {
        type: Type.STRING,
        description: 'One short public sentence explaining why this tool is being invoked.',
      },
      driverId: {
        type: Type.STRING,
        description: 'Optional ID of the driver (e.g., DRV-001). Leave empty to query all available drivers.',
      },
    },
    required: ['purpose'],
  },
};

export const findReturnTripDeclaration: FunctionDeclaration = {
  name: 'find_return_trip',
  description:
    'Searches for compatible return hauls to eliminate empty deadhead miles, computing full trip-cycle economics (empty return cost, cycle net profit, improvement vs returning empty).',
  parameters: {
    type: Type.OBJECT,
    properties: {
      purpose: {
        type: Type.STRING,
        description: 'One short public sentence explaining why this tool is being invoked.',
      },
      origin: {
        type: Type.STRING,
        description: 'Outbound origin city (e.g. Chennai).',
      },
      destination: {
        type: Type.STRING,
        description: 'Outbound destination city (e.g. Bengaluru).',
      },
      outboundDistanceKm: {
        type: Type.NUMBER,
        description: 'One-way distance in km.',
      },
      outboundMileage: {
        type: Type.NUMBER,
        description: 'Loaded truck mileage (default 4.0 km/l).',
      },
      outboundProfit: {
        type: Type.NUMBER,
        description: 'Outbound leg profit in INR.',
      },
      outboundToll: {
        type: Type.NUMBER,
        description: 'Toll cost in INR.',
      },
      arrivalTime: {
        type: Type.STRING,
        description: 'Expected outbound delivery/arrival ISO timestamp.',
      },
      truckCapacityTons: {
        type: Type.NUMBER,
        description: 'Rated payload capacity of the assigned vehicle in tons.',
      },
      supportedCargoTypes: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: 'Cargo categories supported by the vehicle.',
      },
    },
    required: ['purpose', 'origin', 'destination', 'outboundDistanceKm', 'outboundProfit', 'arrivalTime'],
  },
};

export const matchVehicleDeclaration: FunctionDeclaration = {
  name: 'match_vehicle',
  description:
    'Filters and ranks available fleet trucks by cargo capability and payload fit (ideal 60-95%, acceptable 40-60%, oversized <40%, tight >95%). Call when no vehicle is assigned.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      purpose: {
        type: Type.STRING,
        description: 'One short public sentence explaining why this tool is being invoked.',
      },
      weightTons: {
        type: Type.NUMBER,
        description: 'Cargo weight in metric tons.',
      },
      cargoType: {
        type: Type.STRING,
        description: 'Cargo type: general, fmcg, textiles, electronics, or machinery.',
      },
      departureCity: {
        type: Type.STRING,
        description: 'City where vehicle is required (default Chennai).',
      },
    },
    required: ['purpose', 'weightTons', 'cargoType'],
  },
};

export const simulateNegotiationDeclaration: FunctionDeclaration = {
  name: 'simulate_negotiation',
  description:
    'Calculates minimum acceptable rate (10% floor) and target rate (20% target), rounded to nearest ₹50 counter-offer, determining commercial reality.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      purpose: {
        type: Type.STRING,
        description: 'One short public sentence explaining why this tool is being invoked.',
      },
      totalCost: {
        type: Type.NUMBER,
        description: 'Total operating cost for the trip in INR.',
      },
      offeredFreight: {
        type: Type.NUMBER,
        description: 'Current offered freight in INR.',
      },
    },
    required: ['purpose', 'totalCost', 'offeredFreight'],
  },
};

export const evaluateRiskDeclaration: FunctionDeclaration = {
  name: 'evaluate_risk',
  description:
    'Calculates multidimensional risk score (0-100) and classification (LOW, MEDIUM, HIGH) factoring driver history, deadline slack, margin safety, and cargo vulnerability. Call before ACCEPT or REASSIGN.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      purpose: {
        type: Type.STRING,
        description: 'One short public sentence explaining why this tool is being invoked.',
      },
      driverReliabilityScore: { type: Type.NUMBER },
      driverOnTimePercentage: { type: Type.NUMBER },
      driverCancellationRate: { type: Type.NUMBER },
      driverIncidents: { type: Type.NUMBER },
      departureTime: { type: Type.STRING },
      deliveryDeadline: { type: Type.STRING },
      distanceKm: { type: Type.NUMBER },
      marginPercentage: { type: Type.NUMBER },
      isHighValueCargo: { type: Type.BOOLEAN },
      vehicleCapacityTons: { type: Type.NUMBER },
      shipmentWeightTons: { type: Type.NUMBER },
      returnLoadFoundButUnconfirmed: { type: Type.BOOLEAN },
    },
    required: ['purpose', 'departureTime', 'deliveryDeadline', 'distanceKm', 'marginPercentage'],
  },
};

export const submitRecommendationDeclaration: FunctionDeclaration = {
  name: 'submit_recommendation',
  description:
    'TERMINAL TOOL: Call this to finalize and submit the definitive decision for the shipment. Action must be one of: ACCEPT, "ACCEPT + SECURE RETURN LOAD", NEGOTIATE, REASSIGN, WAIT, or REJECT.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      purpose: {
        type: Type.STRING,
        description: 'One short public sentence explaining the conclusion.',
      },
      action: {
        type: Type.STRING,
        description: 'Definitive decision: ACCEPT, ACCEPT + SECURE RETURN LOAD, NEGOTIATE, REASSIGN, WAIT, or REJECT.',
      },
      reasoning: {
        type: Type.STRING,
        description: 'Comprehensive operational justification grounded strictly in tool data.',
      },
      decisionFactors: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: '3 to 5 key bullet points summarizing the decisive factors.',
      },
      nextAction: {
        type: Type.STRING,
        description: 'Concrete immediate operational directive for dispatch manager.',
      },
      assignedDriverId: {
        type: Type.STRING,
        description: 'Nominated driver ID if reassigned or verified.',
      },
      assignedVehicleId: {
        type: Type.STRING,
        description: 'Nominated vehicle ID.',
      },
      selectedReturnLoadId: {
        type: Type.STRING,
        description: 'Return load ID if secured.',
      },
      recommendedFreight: {
        type: Type.NUMBER,
        description: 'Recommended freight in INR if negotiating.',
      },
    },
    required: ['purpose', 'action', 'reasoning', 'decisionFactors', 'nextAction'],
  },
};

export const ALL_TOOL_DECLARATIONS: FunctionDeclaration[] = [
  calculateTripProfitDeclaration,
  whatIfSimulatorDeclaration,
  getTrustPassportDeclaration,
  findReturnTripDeclaration,
  matchVehicleDeclaration,
  simulateNegotiationDeclaration,
  evaluateRiskDeclaration,
  submitRecommendationDeclaration,
];
