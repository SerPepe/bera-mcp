import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { VectorStore } from '../vectorStore.js';
import { EmbeddingService } from '../embeddings.js';
import { Config } from '../config.js';

export function getQueryTool() {
  return [
    {
      name: 'ask_berachain',
      description: 'Ask any question about Berachain development and get an AI-powered answer. This wizard tool uses RAG to search documentation and generates comprehensive, contextual answers using an LLM. Perfect for getting help with Berachain concepts, code examples, integration guides, and more.',
      inputSchema: {
        type: 'object',
        properties: {
          question: {
            type: 'string',
            description: 'The question about Berachain development',
          },
          maxContextChunks: {
            type: 'number',
            description: 'Maximum number of document chunks to use as context (default: 5)',
            default: 5,
          },
        },
        required: ['question'],
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: false,
      },
    },
  ];
}

export async function handleQueryTool(
  name: string,
  args: any,
  vectorStore: VectorStore,
  embeddingService: EmbeddingService,
  config: Config
): Promise<any> {
  if (name === 'ask_berachain' || name === 'query_berachain') {
      const { question, maxContextChunks = 5 } = args as {
        question: string;
        maxContextChunks?: number;
      };

      if (!question || typeof question !== 'string') {
        throw new Error('Question parameter is required and must be a string');
      }

      try {
        const queryEmbedding = await embeddingService.generateEmbedding(question);
        const searchResults = await vectorStore.query(queryEmbedding, maxContextChunks);

        if (searchResults.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    question,
                    answer: 'I could not find relevant documentation to answer this question. Please try rephrasing your question or use the search_docs tool to explore available documentation.',
                    sources: [],
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        const context = searchResults
          .map((result, index) => {
            const cleanPath = result.metadata.filePath.split('/').pop() || result.metadata.filePath;
            const source = `[${index + 1}] ${cleanPath}${result.metadata.sectionTitle ? ` - ${result.metadata.sectionTitle}` : ''}`;
            return `Source: ${source}\nContent: ${result.content}`;
          })
          .join('\n\n');

        const sources = searchResults.map((r) => {
          const cleanPath = r.metadata.filePath.split('/').pop() || r.metadata.filePath;
          return {
            file: cleanPath,
            repo: r.metadata.repo,
            sectionTitle: r.metadata.sectionTitle,
            score: r.score,
          };
        });

        const prompt = `You are an expert Berachain developer assistant. Answer the following question using the provided documentation context.

Question: ${question}

Documentation Context:
${context}

Instructions:
- Provide a comprehensive, detailed answer with code examples when relevant
- Include complete, working code snippets from the documentation
- Explain concepts clearly, especially for complex topics like smart contracts, oracles, and DeFi protocols
- If the documentation contains code examples, include them in full - don't truncate or summarize code
- Cite sources using [1], [2], etc. when referencing specific documentation
- If the documentation doesn't fully answer the question, say so but provide what information is available
- For technical questions, prioritize accuracy and completeness over brevity`;

        const llmResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.openrouter.apiKey}`,
            'HTTP-Referer': 'https://github.com/bera-mcp-server',
            'X-Title': 'Bera MCP Server',
          },
          body: JSON.stringify({
            model: config.openrouter.llmModel,
            messages: [
              {
                role: 'system',
                content: `You are an expert Berachain blockchain development assistant. Your role is to help developers build on Berachain by providing accurate, comprehensive answers based on official documentation.

Key responsibilities:
- Answer questions about Berachain development, smart contracts, DeFi protocols, and integrations
- Provide complete code examples - never truncate or summarize code snippets
- Explain technical concepts clearly, especially for complex topics
- Include all relevant details from the documentation, especially for code examples and integration guides
- Cite sources when referencing documentation
- Be thorough - developers need complete information, especially for code examples

When answering:
- Prioritize completeness and accuracy
- Include full code examples from the documentation
- Explain step-by-step processes clearly
- Provide all necessary details for implementation`,
              },
              {
                role: 'user',
                content: prompt,
              },
            ],
            temperature: 0.7,
          }),
        });

        if (!llmResponse.ok) {
          const errorText = await llmResponse.text();
          throw new Error(`LLM API error: ${llmResponse.status} ${errorText}`);
        }

        const llmData = await llmResponse.json() as {
          choices?: Array<{ message?: { content?: string } }>;
          error?: { message?: string; type?: string };
        };
        
        if (llmData.error) {
          throw new Error(`LLM API error: ${llmData.error.type} - ${llmData.error.message}`);
        }
        
        const answer = llmData.choices?.[0]?.message?.content || 'Failed to generate answer';
        
        if (answer === 'Failed to generate answer') {
          throw new Error('LLM returned empty response. Check API key and model availability.');
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  question,
                  answer,
                  sources,
                  contextChunksUsed: searchResults.length,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error: any) {
        throw new Error(`Query failed: ${error.message}`);
      }
    }

  return null;
}

