import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema, InitializeRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { VectorStore } from './vectorStore.js';
import { EmbeddingService } from './embeddings.js';
import { Config, getConfig } from './config.js';
import { getSearchTools, handleSearchTool } from './tools/search.js';
import { getQueryTool, handleQueryTool } from './tools/query.js';

const version = '0.1.0';

export function createServer(): Server {
  const config = getConfig();
  const vectorStore = new VectorStore(config);
  const embeddingService = new EmbeddingService(config);

  const server = new Server(
    {
      name: 'bera-mcp-server',
      version: version || '0.1.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [...getSearchTools(), ...getQueryTool()],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    const searchResult = await handleSearchTool(name, args, vectorStore, embeddingService);
    if (searchResult !== null) {
      return searchResult;
    }

    const queryResult = await handleQueryTool(name, args, vectorStore, embeddingService, config);
    if (queryResult !== null) {
      return queryResult;
    }

    throw new Error(`Unknown tool: ${name}`);
  });

  server.setRequestHandler(InitializeRequestSchema, async () => {
    return {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {},
      },
      serverInfo: {
        name: 'bera-mcp-server',
        version: version || '0.1.0',
      },
      instructions: `You are the Bera MCP Server, providing access to Berachain development documentation and guides.

Available tools:
1. ask_berachain - 🐻 Wizard tool: Ask any question about Berachain development and get AI-powered answers. Uses RAG to search documentation and generates comprehensive, contextual responses. This is the main tool for answering questions!
2. search_docs - Semantic search across all Berachain documentation. Use this to find relevant documentation chunks.
3. get_doc_section - Retrieve a specific documentation section by file path when you know the exact location.

When users ask questions about Berachain:
- Use ask_berachain (wizard) for natural language questions that need comprehensive answers - this is the primary tool!
- Use search_docs when users want to explore or find specific documentation
- Use get_doc_section when you know the exact file path

Always cite sources when providing information from the documentation.`,
    };
  });

  return server;
}

