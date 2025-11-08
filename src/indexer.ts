import { DocumentDownloader } from './downloader.js';
import { DocumentProcessor } from './processor.js';
import { EmbeddingService } from './embeddings.js';
import { VectorStore } from './vectorStore.js';
import { getConfig } from './config.js';
import { promises as fs } from 'fs';
import path from 'path';

export class Indexer {
  private downloader: DocumentDownloader;
  private processor: DocumentProcessor;
  private embeddingService: EmbeddingService;
  private vectorStore: VectorStore;
  private config = getConfig();

  constructor() {
    this.downloader = new DocumentDownloader(this.config);
    this.processor = new DocumentProcessor(this.config);
    this.embeddingService = new EmbeddingService(this.config);
    this.vectorStore = new VectorStore(this.config);
  }

  async findLocalMarkdownFiles(): Promise<string[]> {
    const localFiles: string[] = [];
    const projectRoot = process.cwd();
    const docsDir = path.join(projectRoot, 'docs');
    const kodiakDocsDir = path.join(projectRoot, 'data', 'kodiak-docs');
    const excludedFiles = ['README.md', 'UPSTASH_SETUP.md'];
    
    // Find files in docs directory
    try {
      const entries = await fs.readdir(docsDir, { withFileTypes: true }).catch(() => []);
      for (const entry of entries) {
        if (
          entry.isFile() && 
          entry.name.endsWith('.md') && 
          !entry.name.startsWith('.') &&
          !excludedFiles.includes(entry.name)
        ) {
          localFiles.push(path.join(docsDir, entry.name));
        }
      }
    } catch (error) {
      console.warn('Could not read docs directory:', error);
    }
    
    // Find files in kodiak-docs directory
    try {
      const entries = await fs.readdir(kodiakDocsDir, { withFileTypes: true }).catch(() => []);
      for (const entry of entries) {
        if (
          entry.isFile() && 
          entry.name.endsWith('.md') && 
          !entry.name.startsWith('.')
        ) {
          localFiles.push(path.join(kodiakDocsDir, entry.name));
        }
      }
    } catch (error) {
      console.warn('Could not read kodiak-docs directory:', error);
    }
    
    return localFiles;
  }

  async index(): Promise<void> {
    console.log('Starting indexing process...');

    console.log('\n=== Step 1: Downloading repositories ===');
    const { docs, guides, abis } = await this.downloader.downloadAll();

    console.log('\n=== Step 1.5: Finding local markdown files ===');
    const localFiles = await this.findLocalMarkdownFiles();
    if (localFiles.length > 0) {
      console.log(`Found ${localFiles.length} local markdown file(s): ${localFiles.map(f => path.basename(f)).join(', ')}`);
    }

    console.log('\n=== Step 2: Processing documents ===');
    const chunks = await this.processor.processRepos(docs, guides, abis, localFiles);
    console.log(`Total chunks to index: ${chunks.length}`);

    if (chunks.length === 0) {
      console.log('No chunks to index. Exiting.');
      return;
    }

    console.log('\n=== Step 3: Generating embeddings ===');
    const texts = chunks.map(chunk => chunk.content);
    const embeddings = await this.embeddingService.generateEmbeddingsBatch(texts);

    console.log('\n=== Step 4: Storing in vector database ===');
    await this.vectorStore.upsert(chunks, embeddings);

    console.log('\n=== Indexing complete! ===');
    console.log(`Indexed ${chunks.length} document chunks`);
  }
}

