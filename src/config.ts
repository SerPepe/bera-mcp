import dotenv from 'dotenv';

dotenv.config();

export interface Config {
  openrouter: {
    apiKey: string;
    embeddingModel: 'google/gemini-embedding-001';
    llmModel: 'z-ai/glm-4.6' | 'minimax/minimax-m2';
  };
  upstash: {
    url: string;
    token: string;
  };
  indexing: {
    chunkSize: number;
    chunkOverlap: number;
    topK: number;
  };
  repos: {
    docs: {
      url: string;
      path: string;
    };
    guides: {
      url: string;
      path: string;
    };
  };
}

export interface UserConfig {
  openrouterApiKey?: string;
  upstashUrl?: string;
  upstashToken?: string;
  llmModel?: 'z-ai/glm-4.6' | 'minimax/minimax-m2';
  chunkSize?: number;
  chunkOverlap?: number;
  topK?: number;
}

export function getConfig(userConfig?: UserConfig): Config {
  const openrouterApiKey = userConfig?.openrouterApiKey || process.env.OPENROUTER_API_KEY;
  if (!openrouterApiKey) {
    throw new Error('OPENROUTER_API_KEY environment variable is required');
  }

  const upstashUrl = userConfig?.upstashUrl || process.env.UPSTASH_VECTOR_REST_URL;
  const upstashToken = userConfig?.upstashToken || process.env.UPSTASH_VECTOR_REST_TOKEN;
  if (!upstashUrl || !upstashToken) {
    throw new Error('UPSTASH_VECTOR_REST_URL and UPSTASH_VECTOR_REST_TOKEN environment variables are required');
  }

  const llmModel = (userConfig?.llmModel || process.env.LLM_MODEL || 'z-ai/glm-4.6') as Config['openrouter']['llmModel'];

  return {
    openrouter: {
      apiKey: openrouterApiKey,
      embeddingModel: 'google/gemini-embedding-001',
      llmModel,
    },
    upstash: {
      url: upstashUrl,
      token: upstashToken,
    },
    indexing: {
      chunkSize: userConfig?.chunkSize || parseInt(process.env.CHUNK_SIZE || '1000', 10),
      chunkOverlap: userConfig?.chunkOverlap || parseInt(process.env.CHUNK_OVERLAP || '200', 10),
      topK: userConfig?.topK || parseInt(process.env.TOP_K || '5', 10),
    },
    repos: {
      docs: {
        url: 'https://github.com/berachain/docs.git',
        path: process.env.DOCS_PATH || './data/docs',
      },
      guides: {
        url: 'https://github.com/berachain/guides.git',
        path: process.env.GUIDES_PATH || './data/guides',
      },
    },
  };
}

export function getEmbeddingDimensions(): number {
  return 3072;
}

