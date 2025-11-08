import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  ListToolsRequestSchema, 
  CallToolRequestSchema, 
  InitializeRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import { VectorStore } from './vectorStore.js';
import { EmbeddingService } from './embeddings.js';
import { Config, getConfig } from './config.js';
import { getSearchTools, handleSearchTool } from './tools/search.js';
import { getQueryTool, handleQueryTool } from './tools/query.js';

const version = '0.1.0';

export function createServer(userConfig?: { config?: any }): Server {
  const config = getConfig(userConfig?.config);
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
        prompts: {},
        resources: {},
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
        prompts: {},
        resources: {},
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

  // Prompts handler
  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return {
      prompts: [
        {
          name: 'ask_berachain_question',
          description: 'Ask a question about Berachain development. This prompt helps you formulate questions to get comprehensive answers about Berachain concepts, code examples, and integration guides.',
          arguments: [
            {
              name: 'question',
              description: 'Your question about Berachain development',
              required: true,
            },
          ],
        },
        {
          name: 'search_berachain_docs',
          description: 'Search Berachain documentation for specific topics. Use this to explore the documentation and find relevant information.',
          arguments: [
            {
              name: 'query',
              description: 'Search query to find relevant documentation',
              required: true,
            },
          ],
        },
      ],
    };
  });

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (name === 'ask_berachain_question') {
      const question = args?.question as string || 'How do I get started with Berachain development?';
      return {
        description: 'Ask a question about Berachain development',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Use the ask_berachain tool to answer this question about Berachain: ${question}`,
            },
          },
        ],
      };
    }

    if (name === 'search_berachain_docs') {
      const query = args?.query as string || 'Berachain getting started';
      return {
        description: 'Search Berachain documentation',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Use the search_docs tool to search for: ${query}`,
            },
          },
        ],
      };
    }

    throw new Error(`Unknown prompt: ${name}`);
  });

  // Resources handler
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
      resources: [
        {
          uri: 'bera://docs/overview',
          name: 'Berachain Documentation Overview',
          description: 'Overview of Berachain development documentation and guides',
          mimeType: 'text/markdown',
        },
        {
          uri: 'bera://docs/search',
          name: 'Search Documentation',
          description: 'Search interface for Berachain documentation',
          mimeType: 'application/json',
        },
      ],
    };
  });

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;

    if (uri === 'bera://docs/overview') {
      return {
        contents: [
          {
            uri,
            mimeType: 'text/markdown',
            text: `# Berachain Documentation Overview

This MCP server provides access to comprehensive Berachain development documentation and guides.

## Available Tools

1. **ask_berachain** - Ask any question about Berachain development and get AI-powered answers
2. **search_docs** - Semantic search across all Berachain documentation
3. **get_doc_section** - Retrieve specific documentation sections by file path

## Getting Started

Use the \`ask_berachain\` tool to ask questions about:
- Smart contract development
- DeFi protocol integration
- Oracle integration (Pyth, etc.)
- Token standards and contracts
- Development tools and setup

## Documentation Sources

- Official Berachain documentation
- Development guides and tutorials
- Code examples and integration guides`,
          },
        ],
      };
    }

    if (uri === 'bera://docs/search') {
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify({
              description: 'Use the search_docs tool to search Berachain documentation',
              example: {
                query: 'HONEY token oracle price',
                topK: 5,
              },
            }, null, 2),
          },
        ],
      };
    }

    throw new Error(`Unknown resource: ${uri}`);
  });

  return server;
}

