import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { VectorStore } from '../vectorStore.js';
import { EmbeddingService } from '../embeddings.js';

export function getSearchTools() {
  return [
    {
      name: 'search_docs',
      description: 'Search Berachain documentation and guides using semantic search. Returns the most relevant document chunks with their metadata including file paths and section titles.',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query to find relevant documentation',
          },
          topK: {
            type: 'number',
            description: 'Number of results to return (default: 5)',
            default: 5,
          },
        },
        required: ['query'],
      },
    },
    {
      name: 'get_doc_section',
      description: 'Retrieve a specific documentation section by file path. Useful when you know the exact location of the documentation you need.',
      inputSchema: {
        type: 'object',
        properties: {
          filePath: {
            type: 'string',
            description: 'The relative file path of the documentation file (e.g., "core/getting-started.md")',
          },
          repo: {
            type: 'string',
            description: 'The repository name: "docs", "guides", or "local"',
            enum: ['docs', 'guides', 'local'],
          },
        },
        required: ['filePath', 'repo'],
      },
    },
  ];
}

export async function handleSearchTool(
  name: string,
  args: any,
  vectorStore: VectorStore,
  embeddingService: EmbeddingService
): Promise<any> {
  if (name === 'search_docs') {
      const { query, topK } = args as { query: string; topK?: number };

      if (!query || typeof query !== 'string') {
        throw new Error('Query parameter is required and must be a string');
      }

      try {
        const queryEmbedding = await embeddingService.generateEmbedding(query);
        const results = await vectorStore.query(queryEmbedding, topK);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  query,
                  results: results.map((r) => ({
                    score: r.score,
                    content: r.content,
                    metadata: r.metadata,
                  })),
                  count: results.length,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error: any) {
        throw new Error(`Search failed: ${error.message}`);
      }
    }

  if (name === 'get_doc_section') {
      const { filePath, repo } = args as { filePath: string; repo: 'docs' | 'guides' };

      if (!filePath || !repo) {
        throw new Error('filePath and repo parameters are required');
      }

      try {
        const queryEmbedding = await embeddingService.generateEmbedding(
          `documentation file: ${filePath} in ${repo} repository`
        );

        const results = await vectorStore.query(queryEmbedding, 10);

        const filtered = results.filter(
          (r) => r.metadata.filePath === filePath && r.metadata.repo === repo
        );

        if (filtered.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    error: 'Document section not found',
                    filePath,
                    repo,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        filtered.sort((a, b) => a.metadata.chunkIndex - b.metadata.chunkIndex);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  filePath,
                  repo,
                  chunks: filtered.map((r) => ({
                    chunkIndex: r.metadata.chunkIndex,
                    content: r.content,
                    sectionTitle: r.metadata.sectionTitle,
                  })),
                  totalChunks: filtered[0]?.metadata.totalChunks || filtered.length,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error: any) {
        throw new Error(`Failed to retrieve document section: ${error.message}`);
      }
    }

  return null;
}

