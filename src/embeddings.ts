import { Config } from './config.js';

export interface EmbeddingResponse {
  embedding: number[];
  model: string;
  usage?: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

export class EmbeddingService {
  private config: Config;
  private apiUrl = 'https://openrouter.ai/api/v1/embeddings';

  constructor(config: Config) {
    this.config = config;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.openrouter.apiKey}`,
        'HTTP-Referer': 'https://github.com/bera-mcp-server',
        'X-Title': 'Bera MCP Server',
      },
      body: JSON.stringify({
        model: this.config.openrouter.embeddingModel,
        input: text,
        dimensions: 3072,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} ${errorText}`);
    }

    const data = await response.json() as {
      data: Array<{ embedding: number[] }>;
    };
    
    if (!data.data || !data.data[0] || !data.data[0].embedding) {
      throw new Error('Invalid response format from OpenRouter');
    }

    const embedding = data.data[0].embedding;
    
    if (embedding.length !== 3072) {
      throw new Error(`Expected 3072 dimensions but got ${embedding.length}. Please check your embedding model configuration.`);
    }

    return embedding;
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.openrouter.apiKey}`,
        'HTTP-Referer': 'https://github.com/bera-mcp-server',
        'X-Title': 'Bera MCP Server',
      },
      body: JSON.stringify({
        model: this.config.openrouter.embeddingModel,
        input: texts,
        dimensions: 3072,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} ${errorText}`);
    }

    const data = await response.json() as {
      data: Array<{ embedding: number[] }>;
    };
    
    if (!data.data || !Array.isArray(data.data)) {
      throw new Error('Invalid response format from OpenRouter');
    }

    return data.data.map((item) => {
      const embedding = item.embedding;
      if (embedding.length !== 3072) {
        throw new Error(`Expected 3072 dimensions but got ${embedding.length} for one of the embeddings.`);
      }
      return embedding;
    });
  }

  async generateEmbeddingWithRetry(
    text: string,
    maxRetries = 3,
    delay = 1000
  ): Promise<number[]> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.generateEmbedding(text);
      } catch (error: any) {
        if (attempt === maxRetries) {
          throw error;
        }
        
        if (error.message?.includes('429') || error.message?.includes('rate limit')) {
          const waitTime = delay * Math.pow(2, attempt - 1);
          console.log(`Rate limited, waiting ${waitTime}ms before retry ${attempt + 1}/${maxRetries}`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else {
          throw error;
        }
      }
    }
    
    throw new Error('Failed to generate embedding after retries');
  }

  async generateEmbeddingsBatch(
    texts: string[],
    batchSize = 10
  ): Promise<number[][]> {
    const allEmbeddings: number[][] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      console.log(`Generating embeddings for batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(texts.length / batchSize)}`);
      
      try {
        const embeddings = await this.generateEmbeddings(batch);
        allEmbeddings.push(...embeddings);
      } catch (error) {
        console.log('Batch failed, falling back to individual requests');
        for (const text of batch) {
          const embedding = await this.generateEmbeddingWithRetry(text);
          allEmbeddings.push(embedding);
        }
      }

      if (i + batchSize < texts.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return allEmbeddings;
  }
}

