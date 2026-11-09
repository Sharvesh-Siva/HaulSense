/**
 * Tool 6: simulate_negotiation
 * Calculates rate targets based on floor (10%) and target (20%) margins,
 * providing realistic counter-offer guidance.
 */

import { z } from 'zod';
import { FLOOR_MARGIN, MAX_REALISTIC_COUNTER_UPLIFT, TARGET_MARGIN } from '../config';
import { SimulateNegotiationOutput } from '../types';

export const SimulateNegotiationSchema = z.object({
  purpose: z.string().min(1, 'Purpose is required'),
  totalCost: z.number().positive('Total operating cost must be positive'),
  offeredFreight: z.number().positive('Offered freight must be positive'),
});

export function simulateNegotiation(rawInput: unknown): SimulateNegotiationOutput {
  const parseResult = SimulateNegotiationSchema.safeParse(rawInput);
  if (!parseResult.success) {
    const errorMsg = parseResult.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    return {
      ok: false,
      error: `Validation error: ${errorMsg}`,
      totalCost: 0,
      offeredFreight: 0,
      minimumAcceptableFreight: 0,
      targetPriceFreight: 0,
      counterOfferFreight: 0,
      upliftPercentage: 0,
      isRealistic: false,
      guidance: 'Validation failure in negotiation simulation.',
    };
  }

  const { totalCost, offeredFreight } = parseResult.data;

  // minimumAcceptable = cost ÷ (1 − 0.10)
  const minimumAcceptableFreight = Math.round(totalCost / (1 - FLOOR_MARGIN));

  // targetPrice = cost ÷ (1 − 0.20)
  const targetPriceFreight = Math.round(totalCost / (1 - TARGET_MARGIN));

  // counterOffer = target rounded up to nearest ₹50
  const counterOfferFreight = Math.ceil(targetPriceFreight / 50) * 50;

  // uplift percentage vs offered
  const uplift = (counterOfferFreight - offeredFreight) / offeredFreight;
  const upliftPercentage = Number((uplift * 100).toFixed(1));

  // A counter-offer more than 25% above the offered freight is unrealistic
  const isRealistic = uplift <= MAX_REALISTIC_COUNTER_UPLIFT;

  let guidance = '';
  if (!isRealistic) {
    guidance = `Counter-offer requires a +${upliftPercentage}% price hike, exceeding the ${MAX_REALISTIC_COUNTER_UPLIFT * 100}% commercial reality threshold. Shipper is unlikely to accept; outright rejection recommended.`;
  } else if (upliftPercentage <= 0) {
    guidance = `Offered freight (₹${offeredFreight.toLocaleString('en-IN')}) already exceeds the target rate for 20% margin. No negotiation required.`;
  } else {
    guidance = `Counter-offer of ₹${counterOfferFreight.toLocaleString('en-IN')} (+${upliftPercentage}%) secures full 20.0% operating margin and remains within reasonable negotiation band.`;
  }

  return {
    ok: true,
    totalCost: Math.round(totalCost),
    offeredFreight: Math.round(offeredFreight),
    minimumAcceptableFreight,
    targetPriceFreight,
    counterOfferFreight,
    upliftPercentage,
    isRealistic,
    guidance,
  };
}
