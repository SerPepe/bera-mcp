import { promises as fs } from 'fs';
import path from 'path';
import { marked } from 'marked';
import { Config } from './config.js';

export interface DocumentChunk {
  id: string;
  content: string;
  metadata: {
    filePath: string;
    repo: 'docs' | 'guides' | 'local';
    chunkIndex: number;
    sectionTitle?: string;
    totalChunks: number;
  };
}

export class DocumentProcessor {
  private config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  async findMarkdownFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    
    async function walkDir(currentDir: string): Promise<void> {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        
        if (entry.name.startsWith('.') || entry.name === 'node_modules') {
          continue;
        }

        if (entry.isDirectory()) {
          await walkDir(fullPath);
        } else if (entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.json'))) {
          files.push(fullPath);
        }
      }
    }

    await walkDir(dir);
    return files;
  }

  async parseMarkdown(filePath: string): Promise<string> {
    const content = await fs.readFile(filePath, 'utf-8');
    
    // If it's a JSON file, parse it and convert to readable text
    if (filePath.endsWith('.json')) {
      try {
        const json = JSON.parse(content);
        // Convert JSON to readable text format
        return JSON.stringify(json, null, 2);
      } catch {
        return content;
      }
    }
    
    // Otherwise parse as markdown
    const tokens = marked.lexer(content);
    
    function extractText(tokens: any[]): string {
      let text = '';
      for (const token of tokens) {
        if (token.type === 'paragraph' || token.type === 'text') {
          text += token.text || token.raw || '';
          text += '\n';
        } else if (token.type === 'heading') {
          text += token.text || '';
          text += '\n';
        } else if (token.type === 'code') {
          text += `\n\`\`\`${token.lang || ''}\n${token.text}\n\`\`\`\n`;
        } else if (token.tokens) {
          text += extractText(token.tokens);
        } else if (token.items) {
          for (const item of token.items) {
            text += extractText(item.tokens || []);
          }
        }
      }
      return text;
    }

    return extractText(tokens).trim();
  }

  chunkText(text: string, chunkSize: number, overlap: number, isJson: boolean = false): string[] {
    // For JSON files, use character-based chunking to avoid huge chunks
    if (isJson) {
      const maxChunkChars = 2000; // Smaller chunks for JSON
      const chunks: string[] = [];
      let start = 0;
      
      while (start < text.length) {
        const end = Math.min(start + maxChunkChars, text.length);
        chunks.push(text.slice(start, end));
        if (end >= text.length) break;
        start = end - Math.floor(maxChunkChars * 0.1); // 10% overlap
      }
      
      return chunks.length > 0 ? chunks : [text];
    }
    
    // For markdown, use word-based chunking
    const chunks: string[] = [];
    const words = text.split(/\s+/);
    
    if (words.length <= chunkSize) {
      return [text];
    }

    let start = 0;
    while (start < words.length) {
      const end = Math.min(start + chunkSize, words.length);
      const chunk = words.slice(start, end).join(' ');
      chunks.push(chunk);
      
      if (end >= words.length) break;
      start = end - overlap;
    }

    return chunks;
  }

  extractSectionTitle(content: string): string | undefined {
    const headingMatch = content.match(/^#+\s+(.+)$/m);
    if (headingMatch) {
      return headingMatch[1].trim();
    }
    return undefined;
  }

  async processFile(
    filePath: string,
    repo: 'docs' | 'guides' | 'local',
    basePath?: string
  ): Promise<DocumentChunk[]> {
    const isJson = filePath.endsWith('.json');
    const text = await this.parseMarkdown(filePath);
    const chunks = this.chunkText(
      text,
      this.config.indexing.chunkSize,
      this.config.indexing.chunkOverlap,
      isJson
    );

    let relativePath: string;
    if (repo === 'local') {
      relativePath = path.basename(filePath);
    } else {
      relativePath = path.relative(
        repo === 'docs' ? this.config.repos.docs.path : this.config.repos.guides.path,
        filePath
      );
    }

    return chunks.map((chunk, index) => {
      const sectionTitle = this.extractSectionTitle(chunk);
      return {
        id: `${repo}-${relativePath}-${index}`.replace(/[^a-zA-Z0-9-_]/g, '-'),
        content: chunk,
        metadata: {
          filePath: relativePath,
          repo,
          chunkIndex: index,
          sectionTitle,
          totalChunks: chunks.length,
        },
      };
    });
  }

  async processDirectory(
    dir: string,
    repo: 'docs' | 'guides'
  ): Promise<DocumentChunk[]> {
    const files = await this.findMarkdownFiles(dir);
    const allChunks: DocumentChunk[] = [];

    console.log(`Processing ${files.length} markdown files from ${repo}...`);

    for (const file of files) {
      try {
        const chunks = await this.processFile(file, repo);
        allChunks.push(...chunks);
      } catch (error) {
        console.error(`Error processing file ${file}:`, error);
      }
    }

    console.log(`Processed ${allChunks.length} chunks from ${repo}`);
    return allChunks;
  }

  async processLocalFiles(filePaths: string[]): Promise<DocumentChunk[]> {
    const allChunks: DocumentChunk[] = [];

    console.log(`Processing ${filePaths.length} local markdown files...`);

    for (const filePath of filePaths) {
      try {
        const chunks = await this.processFile(filePath, 'local');
        allChunks.push(...chunks);
      } catch (error) {
        console.error(`Error processing local file ${filePath}:`, error);
      }
    }

    console.log(`Processed ${allChunks.length} chunks from local files`);
    return allChunks;
  }

  async processRepos(docsPath: string, guidesPath: string, localFiles?: string[]): Promise<DocumentChunk[]> {
    // Only process content directories from docs repo
    const docsContentDirs = [
      path.join(docsPath, 'apps', 'core', 'content'),
      path.join(docsPath, 'apps', 'bex', 'content'),
      path.join(docsPath, 'apps', 'bend', 'content'),
      path.join(docsPath, 'packages', 'config'), // For constants.json
    ];
    
    const docsChunks: DocumentChunk[] = [];
    for (const dir of docsContentDirs) {
      try {
        await fs.access(dir);
        const chunks = await this.processDirectory(dir, 'docs');
        docsChunks.push(...chunks);
      } catch {
        // Directory doesn't exist, skip
      }
    }

    // Process guides - only the apps directory with actual guides
    const guidesContentDir = path.join(guidesPath, 'apps');
    let guidesChunks: DocumentChunk[] = [];
    try {
      await fs.access(guidesContentDir);
      guidesChunks = await this.processDirectory(guidesContentDir, 'guides');
    } catch {
      // If apps doesn't exist, try root
      guidesChunks = await this.processDirectory(guidesPath, 'guides');
    }
    
    const localChunks = localFiles ? await this.processLocalFiles(localFiles) : [];

    return [...docsChunks, ...guidesChunks, ...localChunks];
  }
}

