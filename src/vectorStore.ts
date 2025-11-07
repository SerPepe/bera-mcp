import { Index } from '@upstash/vector';
import { Config, getEmbeddingDimensions } from './config.js';
import { DocumentChunk } from './processor.js';

export interface SearchResult {
  id: string;
  score: number;
  content: string;
  metadata: DocumentChunk['metadata'];
}

export class VectorStore {
  private index: Index;
  private config: Config;
  private dimensions: number;

  constructor(config: Config) {
    this.config = config;
    this.dimensions = getEmbeddingDimensions();
    
    this.index = new Index({
      url: config.upstash.url,
      token: config.upstash.token,
    });
  }

  async upsert(chunks: DocumentChunk[], embeddings: number[][]): Promise<void> {
    if (chunks.length !== embeddings.length) {
      throw new Error('Chunks and embeddings arrays must have the same length');
    }

    const vectors = chunks.map((chunk, index) => ({
      id: chunk.id,
      vector: embeddings[index],
      metadata: {
        content: chunk.content,
        ...chunk.metadata,
      },
    }));

    const batchSize = 100;
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);
      console.log(`Upserting batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(vectors.length / batchSize)}`);
      
      await this.index.upsert(batch);
      
      if (i + batchSize < vectors.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }

  async query(
    queryEmbedding: number[],
    topK?: number
  ): Promise<SearchResult[]> {
    const k = topK || this.config.indexing.topK;

    const results = await this.index.query({
      vector: queryEmbedding,
      topK: k,
      includeMetadata: true,
    });

    return results.map((result: any) => ({
      id: result.id,
      score: result.score || 0,
      content: result.metadata?.content || '',
      metadata: {
        filePath: result.metadata?.filePath || '',
        repo: result.metadata?.repo || 'docs',
        chunkIndex: result.metadata?.chunkIndex || 0,
        sectionTitle: result.metadata?.sectionTitle,
        totalChunks: result.metadata?.totalChunks || 1,
      },
    }));
  }

  async delete(ids: string[]): Promise<void> {
    await this.index.delete(ids);
  }

  async reset(): Promise<void> {
    console.warn('Reset functionality not implemented. Use Upstash console to reset the index.');
  }

  getDimensions(): number {
    return this.dimensions;
  }
}

