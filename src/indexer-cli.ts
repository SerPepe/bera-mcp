import { Indexer } from './indexer.js';

const indexer = new Indexer();
indexer.index().catch((error) => {
  console.error('Indexing failed:', error);
  process.exit(1);
});

