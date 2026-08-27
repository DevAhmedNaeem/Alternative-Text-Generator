import { sanitizeAltText, countWords } from '../utils/fileHelpers';
import type { ModelTier } from '../types';

// Authorized API Key loaded dynamically from .env file (VITE_API_KEY)
export const DEFAULT_API_KEY =
  (import.meta.env.VITE_API_KEY as string) ||
  (import.meta.env.VITE_OPENROUTER_API_KEY as string) ||
  '';

// Strict 30-second timeout per API request (allowing sufficient processing time for vision base64 payloads)
export const REQUEST_TIMEOUT_MS = 30000;

// Optimized, high-speed multi-tier fallback pipeline supporting OpenRouter and AgentRouter
export const MULTI_TIER_MODELS: ModelTier[] = [
  // Tier 1: Fastest Primary Vision Models (Gemini 1.5 Flash & GPT-5.6 Sol)
  {
    id: 'openrouter-gemini-1.5-flash',
    tierNumber: 1,
    model: 'google/gemini-1.5-flash',
    displayName: 'Gemini 1.5 Flash',
    endpoint: '/api/openrouter/api/v1/chat/completions',
  },
  {
    id: 'agentrouter-gpt-5.6-sol',
    tierNumber: 1,
    model: 'gpt-5.6-sol',
    displayName: 'GPT-5.6 Sol',
    endpoint: '/api/agentrouter/v1/chat/completions',
  },
  // Tier 2: High-Speed Secondary Fallback (GPT-4o Mini)
  {
    id: 'openrouter-gpt-4o-mini',
    tierNumber: 2,
    model: 'openai/gpt-4o-mini',
    displayName: 'GPT-4o Mini',
    endpoint: '/api/openrouter/api/v1/chat/completions',
  },
  {
    id: 'agentrouter-claude-opus-5',
    tierNumber: 2,
    model: 'claude-opus-5',
    displayName: 'Claude Opus 5',
    endpoint: '/api/agentrouter/v1/chat/completions',
  },
  // Tier 3: High-Speed Tertiary Fallback (Claude 3 Haiku)
  {
    id: 'openrouter-claude-3-haiku',
    tierNumber: 3,
    model: 'anthropic/claude-3-haiku',
    displayName: 'Claude 3 Haiku',
    endpoint: '/api/openrouter/api/v1/chat/completions',
  },
  {
    id: 'agentrouter-claude-opus-4-8',
    tierNumber: 3,
    model: 'claude-opus-4-8',
    displayName: 'Claude Opus 4.8',
    endpoint: '/api/agentrouter/v1/chat/completions',
  },
];

export const REQUIRED_SYSTEM_PROMPT =
  "You are an expert alt-text specialist. Describe this image in exactly 6 to 8 words. Clearly identify the main subject, colors, specific vehicle/object type, condition, and action (e.g., 'Damaged white SUV loaded onto blue tow truck' or 'Yellow flatbed tow truck carrying gray car'). Output ONLY the pure alt text. Do NOT include <think> tags, reasoning, thinking process, markdown formatting, quotes, or punctuation.";

export interface VisionApiOptions {
  apiKey?: string;
  systemPrompt?: string;
  onTierAttempt?: (tierNumber: number, modelName: string, isRetry: boolean) => void;
}

export interface VisionApiResponse {
  altText: string;
  rawText: string;
  wordCount: number;
  modelUsed: string;
  tierUsed: number;
  executionTimeMs: number;
}

/**
 * Execute single fetch with strict 30s AbortController timeout
 */
async function fetchWithStrictTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = REQUEST_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort(new Error(`Timeout: Model did not respond within ${timeoutMs / 1000} seconds`));
  }, timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error(`Timeout: Model request exceeded ${timeoutMs / 1000}s limit and was aborted.`);
    }
    throw err;
  }
}

/**
 * Automatic Zero-Loss Failover Vision Pipeline
 * Tests Tier 1 (Gemini 1.5 Flash / GPT-5.6 Sol) -> Tier 2 (GPT-4o Mini) -> Tier 3 (Claude 3 Haiku)
 * with a 30s AbortController timeout on every attempt.
 */
export async function generateAltTextWithFailover(
  imageDataUrl: string,
  options: VisionApiOptions = {}
): Promise<VisionApiResponse> {
  const apiKey = options.apiKey?.trim() || DEFAULT_API_KEY;
  const systemPrompt = options.systemPrompt?.trim() || REQUIRED_SYSTEM_PROMPT;

  const errorsEncountered: string[] = [];
  const overallStart = performance.now();

  for (let i = 0; i < MULTI_TIER_MODELS.length; i++) {
    const tier = MULTI_TIER_MODELS[i];
    const isRetry = i > 0;

    // Update UI status with currently active model and tier
    if (options.onTierAttempt) {
      options.onTierAttempt(tier.tierNumber, tier.displayName, isRetry);
    }

    const tierStart = performance.now();

    try {
      const payload = {
        model: tier.model,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Generate descriptive alt text for this image following your system prompt strictly. Return ONLY the final 6 to 8 word alt text, without any <think> tags, reasoning, or quotes.',
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageDataUrl,
                },
              },
            ],
          },
        ],
        max_tokens: 300,
        temperature: 0.2,
      };

      const response = await fetchWithStrictTimeout(
        tier.endpoint,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(payload),
        },
        REQUEST_TIMEOUT_MS
      );

      if (!response.ok) {
        let errMessage = `HTTP ${response.status}`;
        try {
          const errData = await response.json();
          if (errData.error?.message) {
            errMessage = errData.error.message;
          }
        } catch {
          // ignore non-json
        }
        throw new Error(`${tier.displayName} returned ${errMessage}`);
      }

      const data = await response.json();
      const rawText = data.choices?.[0]?.message?.content?.trim() || '';

      if (!rawText) {
        throw new Error(`${tier.displayName} returned an empty completion`);
      }

      const altText = sanitizeAltText(rawText);
      const wordCount = countWords(altText);
      const executionTimeMs = Math.round(performance.now() - tierStart);

      return {
        altText,
        rawText,
        wordCount,
        modelUsed: tier.displayName,
        tierUsed: tier.tierNumber,
        executionTimeMs,
      };
    } catch (err: any) {
      const msg = `${tier.displayName} failed: ${err.message || err}`;
      console.warn(`[Failover] ${msg}. Automatically trying next backup model...`);
      errorsEncountered.push(msg);
      // Instant failover to next tier model in loop
    }
  }

  const totalTime = Math.round(performance.now() - overallStart);
  throw new Error(`All fallback models failed (${totalTime}ms elapsed). Details: ${errorsEncountered.slice(-1)[0]}`);
}
