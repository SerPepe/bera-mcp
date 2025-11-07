import { z } from 'zod';
import { createServer as createServerInternal } from './server.js';

export const configSchema = z.object({
  openrouterApiKey: z.string().describe('Your OpenRouter API key for accessing LLM and embedding models'),
  upstashUrl: z.string().describe('Your Upstash Vector REST URL'),
  upstashToken: z.string().describe('Your Upstash Vector REST token'),
  llmModel: z.enum(['z-ai/glm-4.6', 'minimax/minimax-m2']).default('z-ai/glm-4.6').describe('LLM model to use for generating answers'),
  chunkSize: z.number().default(1000).describe('Document chunk size for indexing'),
  chunkOverlap: z.number().default(200).describe('Document chunk overlap for indexing'),
  topK: z.number().default(5).describe('Number of top results to retrieve for RAG'),
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

