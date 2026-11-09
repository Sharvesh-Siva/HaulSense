/**
 * HaulSense - System Utilities & Deterministic Math Helpers
 */

/**
 * Format currency in Indian standard numbering (Lakhs / Crores)
 * e.g. ₹1,25,000 or -₹2,900
 */
export function formatINR(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || Number.isNaN(amount) || !Number.isFinite(amount)) {
    return '₹0';
  }

  const isNegative = amount < 0;
  const absAmount = Math.round(Math.abs(amount));
  
  // Custom Indian numbering formatting
  const str = absAmount.toString();
  let result = '';
  
  if (str.length <= 3) {
    result = str;
  } else {
    const lastThree = str.substring(str.length - 3);
    const otherNumbers = str.substring(0, str.length - 3);
    const formattedOthers = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    result = `${formattedOthers},${lastThree}`;
  }

  return isNegative ? `-₹${result}` : `₹${result}`;
}

/**
 * Format percentages safely, e.g. 45.8% or -12.1%
 */
export function formatPercent(value: number | undefined | null, decimals = 1): string {
  if (value === undefined || value === null || Number.isNaN(value) || !Number.isFinite(value)) {
    return '0.0%';
  }
  return `${value.toFixed(decimals)}%`;
}

/**
 * Haversine formula to compute great circle distance in km between two lat/lng coordinates
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Creates dynamic timestamps relative to "tomorrow" so dates never get stale
 */
export function getRelativeTime(daysFromNow: number, hours: number, minutes = 0): string {
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysFromNow, hours, minutes, 0, 0);
  return target.toISOString();
}

/**
 * Formats ISO string into human readable time (e.g., "Tomorrow 06:00 AM" or "02 Oct, 08:00 AM")
 */
export function formatDateTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    
    const today = new Date();
    const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();
    
    const timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    
    if (isToday) return `Today ${timeStr}`;
    if (isTomorrow) return `Tomorrow ${timeStr}`;
    
    return `${date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}, ${timeStr}`;
  } catch {
    return isoString;
  }
}

/**
 * Parse transit hours between two ISO strings
 */
export function getHoursBetween(startIso: string, endIso: string): number {
  try {
    const start = new Date(startIso).getTime();
    const end = new Date(endIso).getTime();
    return Math.max(0, (end - start) / (1000 * 60 * 60));
  } catch {
    return 0;
  }
}

/**
 * Sleep helper for timeouts and animation pacing
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
