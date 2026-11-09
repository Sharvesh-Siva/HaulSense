/**
 * HaulSense - Central Configuration and Business Constants
 * All logistics parameters and business rules are consolidated here.
 */

// Model Configuration
export const GEMINI_MODEL = 'gemini-3.8-flash';

// Financial & Operational Constants
export const DIESEL_PRICE_PER_LITRE = 92; // ₹92/litre
export const EMPTY_TRUCK_MILEAGE_MULTIPLIER = 1.15; // 1.15x loaded mileage
export const AVERAGE_SPEED_KMH = 45; // 45 km/h for transit time calculation
export const TARGET_MARGIN = 0.20; // 20% target operational margin
export const FLOOR_MARGIN = 0.10; // 10% floor margin threshold
export const MAX_REALISTIC_COUNTER_UPLIFT = 0.25; // Max 25% counter-offer uplift vs offered freight
export const RETURN_DRIVER_FIXED_COST = 1500; // ₹1,500 return driver allowance

// Return Load Matching Constraints
export const MAX_RETURN_PICKUP_HOURS = 24; // Must pick up within 24 hours of arrival
export const MAX_RETURN_ORIGIN_RADIUS_KM = 50; // Origin within 50 km of outbound destination
export const MAX_RETURN_DEST_RADIUS_KM = 80; // Destination within 80 km of outbound origin

// Agent Safety & Execution Constraints
export const MAX_AGENT_STEPS = 10;
export const MAX_REPLANS = 2;
export const AGENT_TIMEOUT_MS = 30000;

// Company Metadata
export const OPERATOR_NAME = "Sri Murugan Transports";
export const OPERATOR_HUB = "Chennai, Tamil Nadu";
