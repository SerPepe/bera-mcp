import { z } from 'zod';
import { createServer as createServerInternal } from './server.js';
import { configSchema, configJsonSchema } from './config-schema.js';

// Re-export for convenience
export { configSchema, configJsonSchema };

export default function createServer({ config }: { config?: z.infer<typeof configSchema> }) {
  return createServerInternal({ config });
}

export { DocumentDownloader } from './downloader.js';
export { DocumentProcessor } from './processor.js';
export { EmbeddingService } from './embeddings.js';
export { VectorStore } from './vectorStore.js';
export { Indexer } from './indexer.js';
export { getConfig } from './config.js';

