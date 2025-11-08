import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

export const configSchema = z.object({
  openrouterApiKey: z.string().describe('Your OpenRouter API key. Required if OPENROUTER_API_KEY environment variable is not set. Get your key from https://openrouter.ai/keys'),
  upstashUrl: z.string().describe('Your Upstash Vector REST URL. Required if UPSTASH_VECTOR_REST_URL environment variable is not set. Get your URL from your Upstash dashboard.'),
  upstashToken: z.string().describe('Your Upstash Vector REST token. Required if UPSTASH_VECTOR_REST_TOKEN environment variable is not set. Get your token from your Upstash dashboard.'),
  llmModel: z.string().optional().describe('LLM model to use for generating answers. Optional, defaults to "google/gemini-2.5-flash-preview-09-2025". Can also be set via LLM_MODEL environment variable.'),
  chunkSize: z.number().int().positive().optional().describe('Document chunk size for indexing. Optional, defaults to 1000. Can also be set via CHUNK_SIZE environment variable.'),
  chunkOverlap: z.number().int().nonnegative().optional().describe('Document chunk overlap for indexing. Optional, defaults to 200. Can also be set via CHUNK_OVERLAP environment variable.'),
  topK: z.number().int().positive().optional().describe('Number of top results to retrieve for RAG queries. Optional, defaults to 5. Can also be set via TOP_K environment variable.'),
});

// Export JSON schema for MCP configuration documentation
// Use a flattened schema without $ref for MCP compatibility
const rawSchema = zodToJsonSchema(configSchema, {
  name: 'BeraMCPConfig',
  target: 'openApi3',
});

// Flatten the schema if it uses $ref
export const configJsonSchema = (rawSchema as any).$ref 
  ? (rawSchema as any).definitions?.['BeraMCPConfig'] || rawSchema
  : rawSchema;

