/**
 * HaulSense - System Type Definitions
 * Extended with Vehicle Type, Load Requirement Profiles, Multidimensional Matching,
 * Driver Availability, Vehicle Health, Trip Issue Logging, and Compliance Documents.
 */

export type ActionType = 
  | 'ACCEPT' 
  | 'ACCEPT + SECURE RETURN LOAD' 
  | 'NEGOTIATE' 
  | 'REASSIGN' 
  | 'WAIT' 
  | 'REJECT';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type DriverSignal = 'reliable' | 'caution' | 'unreliable';
export type VehicleFitLabel = 'ideal' | 'acceptable' | 'oversized' | 'tight' | 'unsuitable';

export type CargoType = 'general' | 'fmcg' | 'textiles' | 'electronics' | 'machinery' | 'perishables' | 'chemicals';
export type VehicleStatus = 'available' | 'in_transit' | 'in_maintenance' | 'delayed' | 'offline';
export type DriverStatus = 'available' | 'on_trip' | 'available_after_delivery' | 'unavailable' | 'off_duty';
export type TripLifecycleStatus =
  | 'assigned'
  | 'accepted'
  | 'heading_to_pickup'
  | 'arrived_at_pickup'
  | 'pickup'
  | 'goods_collected'
  | 'heading_to_delivery'
  | 'in_transit'
  | 'arrived_at_delivery'
  | 'delivered'
  | 'completed';
export type ShipmentStatus = 'pending_decision' | 'accepted' | 'negotiating' | 'rejected' | 'in_transit' | 'delivered';


export type VehicleTypeName = 
  | 'Mini Truck'
  | 'Light Commercial Vehicle'
  | 'Medium Truck'
  | 'Heavy Truck'
  | 'Flatbed'
  | 'Refrigerated Truck'
  | 'Tanker'
  | 'Multi-Axle Trailer';

export type BodyTypeName = 
  | 'Open'
  | 'Closed Container'
  | 'Tarpaulin Covered'
  | 'Insulated Reefer'
  | 'Flatbed Trailer'
  | 'Tanker';

export type TemperatureRequirement = 'ambient' | 'chilled' | 'frozen';
export type SpecialHandlingRequirement = 'none' | 'fragile' | 'hazardous' | 'high_value' | 'shock_sensitive';

export interface CityCoordinate {
  name: string;
  lat: number;
  lng: number;
}

export interface VehicleHealthComponent {
  name: string;
  healthPercent: number;
  status: 'good' | 'warning' | 'critical';
  details: string;
}

export interface VehicleHealthProfile {
  overallScore: number; // 0 - 100
  serviceDueKm: number;
  tyres: VehicleHealthComponent;
  brakes: VehicleHealthComponent;
  engine: VehicleHealthComponent;
  battery: VehicleHealthComponent;
  oil: VehicleHealthComponent;
  insuranceValidUntil: string;
  permitValidUntil: string;
  pucValidUntil: string;
  recentIssuesCount: number;
}

export interface Vehicle {
  id: string; // e.g. V1, V2, V-TN38
  plateNumber: string; // e.g. TN 38 AB 4521
  vehicleType: VehicleTypeName;
  bodyType: BodyTypeName;
  capacityTons: number; // e.g. 7.5
  volumeCapacityM3: number; // e.g. 28
  mileageKmPerLitre: number; // e.g. 4.2
  fuelType: 'diesel' | 'cng' | 'electric';
  supportedCargo: CargoType[];
  refrigerationCapability: boolean;
  status: VehicleStatus;
  currentLocation: string;
  health: VehicleHealthProfile;
  driverId?: string; // Current assignment if on trip
}

export interface DriverDocument {
  id: string;
  title: string;
  docNumber: string;
  category: 'license' | 'id_proof' | 'training_cert' | 'vehicle_permit';
  validUntil: string;
  status: 'valid' | 'expiring_soon' | 'expired';
  warningDaysRemaining?: number;
}

export interface DriverAvailabilityState {
  status: DriverStatus;
  availableFrom: string;
  preferredCorridors: string[];
  maxDaysAway: number;
  notes?: string;
}

export interface DriverTripIssue {
  id: string;
  tripId: string;
  timestamp: string;
  category: 'traffic_delay' | 'vehicle_issue' | 'loading_delay' | 'customer_delay' | 'weather' | 'accident';
  description: string;
  severity: 'low' | 'medium' | 'high';
  resolved: boolean;
}

export interface Driver {
  id: string; // e.g. DRV-001
  name: string; // e.g. Ravi Kumar
  reliabilityScore: number; // 0 - 100
  onTimePercentage: number; // 0 - 100
  cancellationRatePercentage: number; // 0 - 100
  incidentsCount: number;
  phone: string;
  status: DriverStatus;
  assignedVehicleId?: string; // Currently operated vehicle
  nextAssignedVehicleId?: string; // Next scheduled vehicle
  rating: number; // e.g. 4.9
  totalTripsCompleted: number;
  experienceYears: number;
  monthEarnings: number;
  availability: DriverAvailabilityState;
  documents: DriverDocument[];
}

export interface LoadRequirement {
  cargoType: CargoType;
  cargoWeightTons: number;
  cargoVolumeM3: number;
  requiredVehicleType: VehicleTypeName;
  requiredBodyType: BodyTypeName;
  temperatureRequirement: TemperatureRequirement;
  specialHandling: SpecialHandlingRequirement;
}

export interface Shipment {
  id: string;
  title: string;
  origin: string;
  destination: string;
  distanceKm: number;
  weightTons: number;
  cargoType: CargoType;
  isHighValue?: boolean;
  offeredFreight: number;
  tollCost: number;
  driverCost: number;
  otherCost: number;
  departureTime: string;
  deliveryDeadline: string;
  status: ShipmentStatus;
  lifecycleStatus?: TripLifecycleStatus;
  requirements: LoadRequirement;
  assignedVehicleId?: string;
  assignedDriverId?: string;
  notes?: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  selectedRouteId?: string;
  proofOfDelivery?: ProofOfDelivery;
  timeline?: ShipmentTimelineEvent[];
}

export interface ReturnLoad {
  id: string;
  origin: string;
  destination: string;
  distanceKm: number;
  weightTons: number;
  cargoType: CargoType;
  offeredFreight: number;
  driverShare: number;
  tollCost: number;
  driverCost: number;
  otherCost: number;
  pickupTime: string;
  status: 'available' | 'reserved' | 'unconfirmed';
  requirements: LoadRequirement;
}

export interface Lane {
  id: string;
  origin: string;
  destination: string;
  distanceKm: number;
  standardToll: number;
}

// ================= MATCHING ENGINE TYPES =================

export interface MatchFactorItem {
  name: string;
  pass: boolean;
  weight: number;
  score: number;
  message: string;
}

export interface VehicleMatchItem {
  vehicle: Vehicle;
  matchScore: number; // 0 - 100
  fitLabel: VehicleFitLabel;
  utilizationPercentage: number;
  volumeUtilizationPercentage: number;
  isSuitable: boolean;
  reasons: string[];
  mismatchReasons: string[];
  driver?: Driver;
  factors: MatchFactorItem[];
}

export interface MatchVehicleInput {
  purpose: string;
  requirements: LoadRequirement;
  departureCity?: string;
}

export interface MatchVehicleOutput {
  ok: boolean;
  error?: string;
  matches: VehicleMatchItem[];
  bestVehicle?: VehicleMatchItem;
  hasSuitableMatch: boolean;
}

// ================= TOOL TYPES =================

export interface ToolBaseInput {
  purpose: string;
}

export interface CalculateTripProfitInput extends ToolBaseInput {
  distanceKm: number;
  mileageKmPerLitre: number;
  fuelPricePerLitre?: number;
  offeredFreight: number;
  tollCost: number;
  driverCost: number;
  otherCost: number;
}

export interface CalculateTripProfitOutput {
  ok: boolean;
  error?: string;
  fuelCost: number;
  totalCost: number;
  profit: number;
  marginPercentage: number;
  breakEvenFreight: number;
  offeredFreight: number;
}

export interface WhatIfSimulatorInput extends ToolBaseInput {
  baseline: {
    distanceKm: number;
    mileageKmPerLitre: number;
    fuelPricePerLitre: number;
    offeredFreight: number;
    tollCost: number;
    driverCost: number;
    otherCost: number;
  };
  adjustments: {
    freightChangeAbsolute?: number;
    freightChangePercent?: number;
    fuelPriceAbsolute?: number;
    tollChangeAbsolute?: number;
    driverCostAbsolute?: number;
    mileageKmPerLitre?: number;
  };
}

export interface WhatIfSimulatorOutput {
  ok: boolean;
  error?: string;
  baseline: {
    revenue: number;
    cost: number;
    profit: number;
    marginPercentage: number;
  };
  simulated: {
    revenue: number;
    cost: number;
    profit: number;
    marginPercentage: number;
  };
  deltaProfit: number;
  deltaMarginPercentage: number;
  verdict: string;
}

export interface GetTrustPassportInput extends ToolBaseInput {
  driverId?: string;
}

export interface TrustPassportData {
  driverId: string;
  name: string;
  score: number;
  onTimePercentage: number;
  cancellationRatePercentage: number;
  incidentsCount: number;
  rating: number;
  experienceYears: number;
  totalTripsCompleted: number;
  signal: DriverSignal;
  status: DriverStatus;
  summary: string;
}

export interface GetTrustPassportOutput {
  ok: boolean;
  error?: string;
  singleDriver?: TrustPassportData;
  rankedDrivers?: TrustPassportData[];
}

export interface CompatibleReturnLoad {
  load: ReturnLoad;
  returnNet: number;
  tripCycleProfit: number;
  improvementVsEmptyReturn: number;
}

export interface RejectedReturnLoad {
  load: ReturnLoad;
  reason: string;
}

export interface FindReturnTripInput extends ToolBaseInput {
  origin: string;
  destination: string;
  outboundDistanceKm: number;
  outboundMileage: number;
  outboundProfit: number;
  outboundToll: number;
  arrivalTime: string;
  truckCapacityTons: number;
  supportedCargoTypes?: CargoType[];
}

export interface FindReturnTripOutput {
  ok: boolean;
  error?: string;
  emptyReturnCost: number;
  outboundOnlyCycleProfit: number;
  compatibleLoads: CompatibleReturnLoad[];
  rejectedLoads: RejectedReturnLoad[];
  bestOpportunity?: CompatibleReturnLoad;
}

export interface SimulateNegotiationInput extends ToolBaseInput {
  totalCost: number;
  offeredFreight: number;
}

export interface SimulateNegotiationOutput {
  ok: boolean;
  error?: string;
  totalCost: number;
  offeredFreight: number;
  minimumAcceptableFreight: number;
  targetPriceFreight: number;
  counterOfferFreight: number;
  upliftPercentage: number;
  isRealistic: boolean;
  guidance: string;
}

export interface EvaluateRiskInput extends ToolBaseInput {
  driverReliabilityScore?: number;
  driverOnTimePercentage?: number;
  driverCancellationRate?: number;
  driverIncidents?: number;
  departureTime: string;
  deliveryDeadline: string;
  distanceKm: number;
  marginPercentage: number;
  isHighValueCargo?: boolean;
  vehicleCapacityTons?: number;
  shipmentWeightTons?: number;
  returnLoadFoundButUnconfirmed?: boolean;
}

export interface RiskFactorItem {
  code: string;
  description: string;
  points: number;
}

export interface EvaluateRiskOutput {
  ok: boolean;
  error?: string;
  score: number;
  level: RiskLevel;
  factors: RiskFactorItem[];
  warnings: string[];
  mitigations: string[];
  deadlineSlackHours: number;
}

export interface SubmitRecommendationInput extends ToolBaseInput {
  action: ActionType;
  reasoning: string;
  decisionFactors: string[];
  nextAction: string;
  assignedDriverId?: string;
  assignedVehicleId?: string;
  selectedReturnLoadId?: string;
  recommendedFreight?: number;
}

export interface SubmitRecommendationOutput {
  ok: boolean;
  accepted: boolean;
  action: ActionType;
  reasoning: string;
  decisionFactors: string[];
  nextAction: string;
  assignedDriverId?: string;
  assignedVehicleId?: string;
  selectedReturnLoadId?: string;
  recommendedFreight?: number;
  replanRequired?: boolean;
  replanReason?: string;
}

// ================= AGENT EVENT STREAM TYPES =================

export type AgentEventType = 
  | 'understood' 
  | 'tool_called' 
  | 'tool_result' 
  | 'evaluating' 
  | 'replan' 
  | 'recommendation' 
  | 'error';

export interface AgentEventUnderstood {
  type: 'understood';
  goal: string;
  shipmentId: string;
  keyContext: string;
}

export interface AgentEventToolCalled {
  type: 'tool_called';
  tool: string;
  purpose: string;
  step: number;
  input: Record<string, unknown>;
}

export interface AgentEventToolResult {
  type: 'tool_result';
  tool: string;
  step: number;
  summary: string;
  data: Record<string, unknown>;
}

export interface AgentEventEvaluating {
  type: 'evaluating';
  step: number;
  observation: string;
}

export interface AgentEventReplan {
  type: 'replan';
  attempt: number;
  reason: string;
  instruction: string;
}

export interface FinalRecommendationSummary {
  action: ActionType;
  reasoning: string;
  decisionFactors: string[];
  nextAction: string;
  assignedDriverId?: string;
  assignedVehicleId?: string;
  selectedReturnLoadId?: string;
  recommendedFreight?: number;
  outboundProfit?: number;
  outboundMargin?: number;
  tripCycleProfit?: number;
  riskLevel?: RiskLevel;
  totalCost?: number;
  emptyReturnCost?: number;
  cycleImprovement?: number;
  guardrailNote?: string;
}

export interface AgentEventRecommendation {
  type: 'recommendation';
  recommendation: FinalRecommendationSummary;
  runSummary: {
    stepsCompleted: number;
    toolsUsed: string[];
    replansCount: number;
    executionTimeMs: number;
  };
}

export interface AgentEventError {
  type: 'error';
  message: string;
  code?: string;
}

export type AgentEvent = 
  | AgentEventUnderstood
  | AgentEventToolCalled
  | AgentEventToolResult
  | AgentEventEvaluating
  | AgentEventReplan
  | AgentEventRecommendation
  | AgentEventError;

export interface AgentRunTrace {
  shipmentId: string;
  timestamp: string;
  events: AgentEvent[];
  recommendation?: FinalRecommendationSummary;
  toolsInvoked: string[];
  durationMs: number;
}

// ================= TRIP CHAT TYPES =================

export type ChatAttachmentType = 'location_pin' | 'pod_photo' | 'seal_verification' | 'toll_receipt' | 'fuel_slip';

export interface TripChatMessage {
  id: string;
  tripId: string;
  senderRole: 'manager' | 'driver';
  senderId: string;
  senderName: string;
  timestamp: string;
  text: string;
  attachmentType?: ChatAttachmentType;
  attachmentTitle?: string;
  attachmentData?: string;
  readByOtherRole: boolean;
}

export interface ProofOfDelivery {
  receiverName: string;
  receiverConfirmationCode: string;
  deliveryTimestamp: string;
  deliveryNotes: string;
  photoDataUrl?: string;
  verifiedByDriverId: string;
}

export type NotificationType =
  | 'mismatch_alert'
  | 'status_change'
  | 'incident'
  | 'return_load_match'
  | 'assignment'
  | 'route_deviation'
  | 'gps_alert'
  | 'delay_alert'
  | 'fuel_anomaly';

export interface ShipmentTimelineEvent {
  id: string;
  timestamp: string;
  stage:
    | TripLifecycleStatus
    | 'created'
    | 'driver_assigned'
    | 'route_selected'
    | 'route_deviation'
    | 'incident_reported'
    | 'pod_submitted'
    | 'delay_alert'
    | 'fuel_anomaly';
  title: string;
  description: string;
  actorName: string;
  actorRole: 'manager' | 'driver' | 'system';
}

export interface RouteAlternative {
  id: string;
  label: string; // e.g. 'Route A — Fastest (NH-48 Golden Quadrilateral)'
  highwaySummary: string;
  distanceKm: number;
  durationMinutes: number;
  trafficDelayMinutes: number;
  estimatedTollINR: number;
  suitabilityScore: number; // 0 - 100
  isRecommended: boolean;
  recommendationReason: string;
  pathCoordinates: Array<{ lat: number; lng: number }>;
  warnings?: string[];
}

export interface LiveGpsTelemetry {
  vehicleId: string;
  driverId: string;
  shipmentId: string;
  lat: number;
  lng: number;
  accuracyMeters: number;
  speedKmh: number;
  headingDegrees?: number;
  timestamp: string;
  isLiveDeviceGps: boolean;
  sharingActive: boolean;
  connectionStatus: 'online' | 'stale' | 'offline';
  corridorLabel: string;
  remainingDistanceKm: number;
  estimatedArrivalIso: string;
  routeDeviationDetected?: boolean;
  deviationMeters?: number;
  fuelAnomalyDetected?: boolean;
  fuelVariancePercent?: number;
  fuelRateLitresPerHour?: number;
  delayMinutes?: number;
}

export interface CorridorCheckpointMetric {
  checkpoint: string;
  distanceKm: number;
  historicalAvgElapsedMin: number;
  historicalP90ElapsedMin: number;
  currentJourneyElapsedMin: number | null;
  forecastedElapsedMin: number;
  historicalAvgSpeedKmh: number;
  currentSpeedKmh: number;
  historicalFuelBurnLitres: number;
  currentFuelBurnLitres: number;
  status: 'completed' | 'current' | 'upcoming';
  anomalyNote?: string;
}

export interface SecurityAuditLogEntry {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: 'manager' | 'driver' | 'anonymous' | 'system';
  action: string;
  targetRecord: string;
  status: 'success' | 'denied' | 'warning';
  details: string;
}


