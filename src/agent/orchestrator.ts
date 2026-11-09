/**
 * HaulSense - Agent Decision Orchestrator
 * Implements the autonomous agent loop, multi-turn function calling,
 * guardrail enforcement, and deterministic state extraction.
 */

import { GoogleGenAI } from '@google/genai';
import { GEMINI_MODEL, MAX_AGENT_STEPS, MAX_REPLANS } from '../config';
import {
  ActionType,
  AgentEvent,
  AgentRunTrace,
  FinalRecommendationSummary,
  RiskLevel,
  Shipment,
} from '../types';
import {
  ALL_TOOL_DECLARATIONS,
  executeToolByName,
  GuardrailValidationContext,
  validateRecommendationGuardrails,
} from '../tools';

export interface RunAgentOptions {
  shipment: Shipment;
  userQuestion: string;
  onEvent: (event: AgentEvent) => void;
  apiKey?: string;
  abortSignal?: AbortSignal;
}

export async function runAgentOrchestrator(options: RunAgentOptions): Promise<AgentRunTrace> {
  const { shipment, userQuestion, onEvent, apiKey, abortSignal } = options;
  const startTime = Date.now();
  const events: AgentEvent[] = [];
  const toolsInvoked: string[] = [];

  const emit = (event: AgentEvent) => {
    events.push(event);
    onEvent(event);
  };

  // 1. Initial Understood Event
  const understoodGoal = `Analyze shipment ${shipment.id} (${shipment.origin} → ${shipment.destination}, ${shipment.weightTons}t ${shipment.cargoType}) to determine operational commitment.`;
  const contextSummary = `Offered freight: ₹${shipment.offeredFreight.toLocaleString('en-IN')}, Distance: ${shipment.distanceKm} km, Assigned truck: ${shipment.assignedVehicleId || 'None'}, Assigned driver: ${shipment.assignedDriverId || 'None'}.`;

  emit({
    type: 'understood',
    goal: understoodGoal,
    shipmentId: shipment.id,
    keyContext: contextSummary,
  });

  // Check API key presence
  const activeKey = apiKey || (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : undefined);
  if (!activeKey) {
    emit({
      type: 'error',
      message: "The AI service isn't configured yet. Please provide a GEMINI_API_KEY in the Secrets panel to activate live agent orchestration.",
      code: 'API_KEY_MISSING',
    });
    return {
      shipmentId: shipment.id,
      timestamp: new Date().toISOString(),
      events,
      toolsInvoked,
      durationMs: Date.now() - startTime,
    };
  }

  // Tracking context for guardrails and deterministic metrics extraction
  const guardrailContext: GuardrailValidationContext = {
    profitCalculated: false,
    riskEvaluated: false,
    returnTripSearched: false,
    returnTripHasPositiveImprovement: false,
    rankedDriversFetched: false,
    replacementDriverFound: false,
    negotiationSimulated: false,
  };

  const toolOutputsAccumulator: {
    profit?: { profit: number; marginPercentage: number; totalCost: number; fuelCost: number };
    returnTrip?: {
      emptyReturnCost: number;
      outboundOnlyCycleProfit: number;
      bestOpportunity?: {
        tripCycleProfit: number;
        improvementVsEmptyReturn: number;
        load: { id: string };
      };
    };
    risk?: { score: number; level: RiskLevel };
    driver?: { reliabilityScore: number };
    negotiation?: { counterOfferFreight: number; isRealistic: boolean; upliftPercentage: number };
    matchedVehicleId?: string;
    nominatedDriverId?: string;
  } = {};

  let replanCount = 0;
  let finalRecommendationSummary: FinalRecommendationSummary | undefined;

  try {
    const ai = new GoogleGenAI({
      apiKey: activeKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const initialPrompt = `Manager Request: "${userQuestion}"

Target Shipment Data:
- ID: ${shipment.id}
- Route: ${shipment.origin} → ${shipment.destination} (${shipment.distanceKm} km)
- Payload: ${shipment.weightTons} tons of ${shipment.cargoType} (${shipment.isHighValue ? 'HIGH-VALUE CARGO' : 'Standard cargo'})
- Offered Freight: ₹${shipment.offeredFreight}
- Standard Toll: ₹${shipment.tollCost}
- Driver Allowance: ₹${shipment.driverCost}
- Incidentals/Other: ₹${shipment.otherCost}
- Departure: ${shipment.departureTime}
- Delivery Deadline: ${shipment.deliveryDeadline}
- Assigned Vehicle: ${shipment.assignedVehicleId || 'None (Requires match_vehicle)'}
- Assigned Driver: ${shipment.assignedDriverId || 'None (Requires driver assessment)'}
${shipment.notes ? `- Dispatcher Notes: ${shipment.notes}` : ''}

Determine the optimal operational decision. Remember: choose tools dynamically based on this shipment's specific situation. Do not calculate money yourself. Stop and call submit_recommendation when you have enough proof.`;

    // Initialize conversation history
    const contents: any[] = [
      {
        role: 'user',
        parts: [{ text: initialPrompt }],
      },
    ];

    let step = 0;

    while (step < MAX_AGENT_STEPS) {
      if (abortSignal?.aborted) {
        emit({ type: 'error', message: 'Agent execution was cancelled by user.' });
        break;
      }

      step++;

      // Call Gemini model with transient error fallback
      let response: any;
      const candidateModels = [GEMINI_MODEL, 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
      let lastErr: any = null;

      for (const modelToTry of candidateModels) {
        try {
          response = await ai.models.generateContent({
            model: modelToTry,
            contents,
            config: {
              systemInstruction:
                'You are HaulSense Agent. You make decisions for freight operators in India by orchestrating deterministic tools. AI decides, code calculates. Never compute money yourself. Call submit_recommendation when finished.',
              tools: [{ functionDeclarations: ALL_TOOL_DECLARATIONS }],
              temperature: 0.1, // Low temperature for high precision and discipline
            },
          });
          if (response) break;
        } catch (err: any) {
          lastErr = err;
          const status = err?.status || err?.code;
          const msg = err?.message || '';
          if (msg.includes('503') || msg.includes('404') || status === 503 || status === 404 || status === 'UNAVAILABLE') {
            // Wait 400ms and try next fallback model
            await new Promise((resolve) => setTimeout(resolve, 400));
            continue;
          }
          throw err;
        }
      }

      if (!response && lastErr) {
        throw lastErr;
      }

      const candidate = response.candidates?.[0];
      const modelContent = candidate?.content;
      const functionCalls = response.functionCalls;

      // Check if model responded with function call(s)
      if (functionCalls && functionCalls.length > 0) {
        // Append model response to conversation history
        contents.push(modelContent || { role: 'model', parts: [{ text: 'Invoking tools...' }] });

        const toolResponsesParts: any[] = [];

        for (const call of functionCalls) {
          const toolName = call.name || 'unknown_tool';
          const toolArgs = (call.args || {}) as Record<string, unknown>;
          const purpose = (toolArgs.purpose as string) || `Executing ${toolName}`;

          toolsInvoked.push(toolName);

          emit({
            type: 'tool_called',
            tool: toolName,
            purpose,
            step,
            input: toolArgs,
          });

          // Check if terminal tool
          if (toolName === 'submit_recommendation') {
            const rawAction = toolArgs.action as ActionType;

            // Check guardrails
            const guardrailResult = validateRecommendationGuardrails(rawAction, guardrailContext);

            if (!guardrailResult.valid) {
              if (replanCount < MAX_REPLANS) {
                replanCount++;
                emit({
                  type: 'replan',
                  attempt: replanCount,
                  reason: guardrailResult.violationReason || 'Guardrail validation failure',
                  instruction: `Recommendation rejected: ${guardrailResult.violationReason}. Investigate with appropriate tools or adjust your action.`,
                });

                toolResponsesParts.push({
                  functionResponse: {
                    name: toolName,
                    response: {
                      accepted: false,
                      replanRequired: true,
                      replanReason: guardrailResult.violationReason,
                      instruction:
                        'Please invoke the required missing tools or alter the proposed action to adhere to operational safety rules.',
                    },
                  },
                });
                continue;
              } else {
                // Max replans exceeded: fall back to safest valid action
                const fallback = guardrailResult.fallbackAction || 'WAIT';
                toolArgs.action = fallback;
                toolArgs.reasoning = `${toolArgs.reasoning} [GUARDRAIL FALLBACK: Adjusted to ${fallback} after ${MAX_REPLANS} replan cycles due to: ${guardrailResult.violationReason}]`;
              }
            }

            // Valid terminal call or accepted fallback
            const finalAction = toolArgs.action as ActionType;
            const reasoning = (toolArgs.reasoning as string) || '';
            const decisionFactors = (toolArgs.decisionFactors as string[]) || [];
            const nextAction = (toolArgs.nextAction as string) || '';
            const assignedDriverId =
              (toolArgs.assignedDriverId as string) ||
              toolOutputsAccumulator.nominatedDriverId ||
              shipment.assignedDriverId;
            const assignedVehicleId =
              (toolArgs.assignedVehicleId as string) ||
              toolOutputsAccumulator.matchedVehicleId ||
              shipment.assignedVehicleId;
            const selectedReturnLoadId =
              (toolArgs.selectedReturnLoadId as string) ||
              toolOutputsAccumulator.returnTrip?.bestOpportunity?.load.id;
            const recommendedFreight =
              (toolArgs.recommendedFreight as number) ||
              toolOutputsAccumulator.negotiation?.counterOfferFreight;

            // Strict deterministic derivation: fill numbers strictly from tool results
            finalRecommendationSummary = {
              action: finalAction,
              reasoning,
              decisionFactors,
              nextAction,
              assignedDriverId,
              assignedVehicleId,
              selectedReturnLoadId,
              recommendedFreight,
              outboundProfit: toolOutputsAccumulator.profit?.profit,
              outboundMargin: toolOutputsAccumulator.profit?.marginPercentage,
              tripCycleProfit:
                toolOutputsAccumulator.returnTrip?.bestOpportunity?.tripCycleProfit ??
                toolOutputsAccumulator.profit?.profit,
              riskLevel: toolOutputsAccumulator.risk?.level ?? 'LOW',
              totalCost: toolOutputsAccumulator.profit?.totalCost,
              emptyReturnCost: toolOutputsAccumulator.returnTrip?.emptyReturnCost,
              cycleImprovement:
                toolOutputsAccumulator.returnTrip?.bestOpportunity?.improvementVsEmptyReturn,
            };

            emit({
              type: 'recommendation',
              recommendation: finalRecommendationSummary,
              runSummary: {
                stepsCompleted: step,
                toolsUsed: Array.from(new Set(toolsInvoked)),
                replansCount: replanCount,
                executionTimeMs: Date.now() - startTime,
              },
            });

            return {
              shipmentId: shipment.id,
              timestamp: new Date().toISOString(),
              events,
              recommendation: finalRecommendationSummary,
              toolsInvoked,
              durationMs: Date.now() - startTime,
            };
          }

          // Execute non-terminal tool
          const executionResult = executeToolByName(toolName, toolArgs, guardrailContext);

          // Update guardrail context and tool accumulator
          if (toolName === 'calculate_trip_profit' && executionResult.data.ok) {
            guardrailContext.profitCalculated = true;
            guardrailContext.marginPercentage = executionResult.data.marginPercentage as number;
            toolOutputsAccumulator.profit = {
              profit: executionResult.data.profit as number,
              marginPercentage: executionResult.data.marginPercentage as number,
              totalCost: executionResult.data.totalCost as number,
              fuelCost: executionResult.data.fuelCost as number,
            };
          }

          if (toolName === 'evaluate_risk' && executionResult.data.ok) {
            guardrailContext.riskEvaluated = true;
            guardrailContext.riskLevel = executionResult.data.level as 'LOW' | 'MEDIUM' | 'HIGH';
            toolOutputsAccumulator.risk = {
              score: executionResult.data.score as number,
              level: executionResult.data.level as RiskLevel,
            };
          }

          if (toolName === 'get_trust_passport' && executionResult.data.ok) {
            if (executionResult.data.singleDriver) {
              const single = executionResult.data.singleDriver as any;
              guardrailContext.driverReliability = single.score;
            }
            if (executionResult.data.rankedDrivers) {
              guardrailContext.rankedDriversFetched = true;
              const ranked = executionResult.data.rankedDrivers as any[];
              const bestCandidate = ranked.find((d) => d.score >= 80);
              if (bestCandidate) {
                guardrailContext.replacementDriverFound = true;
                guardrailContext.replacementDriverScore = bestCandidate.score;
                toolOutputsAccumulator.nominatedDriverId = bestCandidate.driverId;
              }
            }
          }

          if (toolName === 'find_return_trip' && executionResult.data.ok) {
            guardrailContext.returnTripSearched = true;
            const best = executionResult.data.bestOpportunity as any;
            if (best && best.improvementVsEmptyReturn > 0) {
              guardrailContext.returnTripHasPositiveImprovement = true;
            }
            toolOutputsAccumulator.returnTrip = {
              emptyReturnCost: executionResult.data.emptyReturnCost as number,
              outboundOnlyCycleProfit: executionResult.data.outboundOnlyCycleProfit as number,
              bestOpportunity: best,
            };
          }

          if (toolName === 'simulate_negotiation' && executionResult.data.ok) {
            guardrailContext.negotiationSimulated = true;
            guardrailContext.negotiationRealistic = executionResult.data.isRealistic as boolean;
            toolOutputsAccumulator.negotiation = {
              counterOfferFreight: executionResult.data.counterOfferFreight as number,
              isRealistic: executionResult.data.isRealistic as boolean,
              upliftPercentage: executionResult.data.upliftPercentage as number,
            };
          }

          if (toolName === 'match_vehicle' && executionResult.data.ok) {
            const best = executionResult.data.bestVehicle as any;
            if (best) {
              toolOutputsAccumulator.matchedVehicleId = best.vehicle.id;
            }
          }

          emit({
            type: 'tool_result',
            tool: toolName,
            step,
            summary: executionResult.summary,
            data: executionResult.data,
          });

          toolResponsesParts.push({
            functionResponse: {
              name: toolName,
              response: { output: executionResult.rawOutput },
            },
          });
        }

        // Push tool responses back into conversation for next turn
        contents.push({
          role: 'user',
          parts: toolResponsesParts,
        });
      } else {
        // Model returned plain text instead of tool call. Nudge it once.
        emit({
          type: 'evaluating',
          step,
          observation: candidate?.content?.parts?.[0]?.text || 'Synthesizing decision state...',
        });

        contents.push(modelContent || { role: 'model', parts: [{ text: 'Evaluating...' }] });
        contents.push({
          role: 'user',
          parts: [
            {
              text: 'Nudge: As an autonomous decision orchestrator, please select tools or call submit_recommendation to deliver your definitive operational verdict.',
            },
          ],
        });
      }
    }

    // Step limit reached
    if (!abortSignal?.aborted && !finalRecommendationSummary) {
      emit({
        type: 'error',
        message: `Agent reached maximum step limit (${MAX_AGENT_STEPS} steps) without completing final recommendation.`,
        code: 'STEP_CAP_REACHED',
      });
    }
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    emit({
      type: 'error',
      message: `Agent execution failed: ${errorMsg}`,
      code: 'EXECUTION_EXCEPTION',
    });
  }

  return {
    shipmentId: shipment.id,
    timestamp: new Date().toISOString(),
    events,
    recommendation: finalRecommendationSummary,
    toolsInvoked,
    durationMs: Date.now() - startTime,
  };
}
