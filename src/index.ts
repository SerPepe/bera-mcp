import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { createServer as createServerInternal } from './server.js';

export const configSchema = z.object({
  openrouterApiKey: z.string().optional().describe('Your OpenRouter API key (optional if OPENROUTER_API_KEY env var is set)'),
  upstashUrl: z.string().optional().describe('Your Upstash Vector REST URL (optional if UPSTASH_VECTOR_REST_URL env var is set)'),
  upstashToken: z.string().optional().describe('Your Upstash Vector REST token (optional if UPSTASH_VECTOR_REST_TOKEN env var is set)'),
  llmModel: z.string().optional().describe('LLM model to use for generating answers (optional, defaults to google/gemini-2.5-flash-preview-09-2025)'),
  chunkSize: z.number().optional().describe('Document chunk size for indexing (optional, defaults to 1000)'),
  chunkOverlap: z.number().optional().describe('Document chunk overlap for indexing (optional, defaults to 200)'),
  topK: z.number().optional().describe('Number of top results to retrieve for RAG (optional, defaults to 5)'),
});

// Export JSON schema for MCP configuration documentation
export const configJsonSchema = zodToJsonSchema(configSchema, {
  name: 'BeraMCPConfig',
  target: 'openApi3',
});

export default function createServer({ config }: { config?: z.infer<typeof configSchema> }) {
  return createServerInternal({ config });
}

export { DocumentDownloader } from './downloader.js';
export { DocumentProcessor } from './processor.js';
export { EmbeddingService } from './embeddings.js';
export { VectorStore } from './vectorStore.js';
export { Indexer } from './indexer.js';
export { getConfig } from './config.js';

