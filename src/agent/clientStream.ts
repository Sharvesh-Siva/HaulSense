/**
 * HaulSense - Client-Side SSE Stream Consumer & Fallback Runner
 * Connects to POST /api/agent/run, parses Server-Sent Events,
 * and handles disconnects, retries, and browser-side execution fallback.
 */

import { AgentEvent, AgentRunTrace, Shipment } from '../types';
import { runAgentOrchestrator } from './orchestrator';

export interface StreamAgentRunOptions {
  shipment: Shipment;
  userQuestion: string;
  onEvent: (event: AgentEvent) => void;
  signal?: AbortSignal;
}

export async function streamAgentRun(options: StreamAgentRunOptions): Promise<AgentRunTrace> {
  const { shipment, userQuestion, onEvent, signal } = options;
  const events: AgentEvent[] = [];
  const toolsInvoked: string[] = [];
  const startTime = Date.now();

  const handleEvent = (event: AgentEvent) => {
    events.push(event);
    if (event.type === 'tool_called') {
      toolsInvoked.push(event.tool);
    }
    onEvent(event);
  };

  try {
    // Attempt connecting to the backend SSE endpoint
    const response = await fetch('/api/agent/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        shipmentId: shipment.id,
        shipment,
        userQuestion,
      }),
      signal,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Server returned HTTP ${response.status}: ${errText}`);
    }

    if (!response.body) {
      throw new Error('Response body is null, cannot stream SSE.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      if (signal?.aborted) {
        reader.cancel();
        break;
      }

      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const block of lines) {
        const trimmed = block.trim();
        if (!trimmed.startsWith('data:')) continue;
        const jsonStr = trimmed.replace(/^data:\s*/, '');
        try {
          const event: AgentEvent = JSON.parse(jsonStr);
          handleEvent(event);
        } catch (e) {
          console.error('[HaulSense Stream] Failed to parse SSE event chunk:', jsonStr, e);
        }
      }
    }
  } catch (err: any) {
    if (signal?.aborted) {
      return {
        shipmentId: shipment.id,
        timestamp: new Date().toISOString(),
        events,
        toolsInvoked,
        durationMs: Date.now() - startTime,
      };
    }

    console.warn('[HaulSense Stream] Server stream failed or unavailable, falling back to local orchestrator:', err);
    
    // In case server endpoint is unreachable (e.g. during static client dev or isolated environment)
    await runAgentOrchestrator({
      shipment,
      userQuestion,
      onEvent: handleEvent,
      abortSignal: signal,
    });
  }

  // Find final recommendation if emitted
  const recEvent = events.find((e) => e.type === 'recommendation');
  const recommendation = recEvent?.type === 'recommendation' ? recEvent.recommendation : undefined;

  const trace: AgentRunTrace = {
    shipmentId: shipment.id,
    timestamp: new Date().toISOString(),
    events,
    recommendation,
    toolsInvoked,
    durationMs: Date.now() - startTime,
  };

  // Cache last run trace in sessionStorage for the "Replay last run" feature
  try {
    sessionStorage.setItem(`haulsense_trace_${shipment.id}`, JSON.stringify(trace));
  } catch (e) {
    // Quota or incognito restriction
  }

  return trace;
}

export function getLastSavedTrace(shipmentId: string): AgentRunTrace | null {
  try {
    const raw = sessionStorage.getItem(`haulsense_trace_${shipmentId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
