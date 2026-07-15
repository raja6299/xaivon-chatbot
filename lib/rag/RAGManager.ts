import { SemanticChunker } from './chunking/semantic';
import { knowledgeBase } from '../knowledge-base';
import { MockEmbeddingProvider } from './embeddings/mock';
import { DocumentMetadata, EmbeddingProvider, RAGConfig, SearchResult, VectorStore } from './types';
import { MemoryVectorStore } from './vector/memory';

export class RAGManager {
  private static instance: RAGManager;
  private chunker: SemanticChunker;
  private embedder: EmbeddingProvider;
  private store: VectorStore;
  private config: RAGConfig;

  private constructor(config?: Partial<RAGConfig>) {
    this.config = {
      chunkSize: 1000,
      chunkOverlap: 200,
      ...config
    };
    
    // Default provider initializations (Can be injected/swapped for production)
    this.chunker = new SemanticChunker(this.config.chunkSize, this.config.chunkOverlap);
    this.embedder = new MockEmbeddingProvider(384);
    this.store = new MemoryVectorStore();
  }

  public static getInstance(): RAGManager {
    if (!RAGManager.instance) {
      RAGManager.instance = new RAGManager();
    }
    return RAGManager.instance;
  }

  private isInitialized = false;

  /**
   * Initializes the RAG system with default internal knowledge base if empty.
   */
  public async initializeWithDefaults(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Convert knowledge base JSON to a markdown-like string for chunking
    let kbText = `# Company Overview\n${knowledgeBase.company.name}: ${knowledgeBase.company.tagline}\n${knowledgeBase.company.description}\nWebsite: ${knowledgeBase.company.website}\n\n`;
    
    kbText += `# Services & Pricing\n`;
    knowledgeBase.services.forEach(s => {
      kbText += `## ${s.category}\n${s.description}\n`;
      s.tiers.forEach(t => {
        kbText += `- ${t.name}: ${t.price} (${t.includes.join(', ')})\n`;
      });
    });

    kbText += `\n# FAQ\n`;
    knowledgeBase.faq.forEach(f => {
      kbText += `Q: ${f.question}\nA: ${f.answer}\n\n`;
    });

    await this.addDocument(kbText, {
      documentId: 'internal-kb-001',
      documentName: 'XAIVON Internal Knowledge Base',
      source: 'System',
      section: 'Core Knowledge',
      uploadTime: new Date().toISOString()
    });
  }

  /**
   * Add a new document to the RAG Knowledge Base.
   * Performs Semantic Chunking -> Embedding -> Vector Store Insertion
   */
  public async addDocument(text: string, metadata: DocumentMetadata): Promise<void> {
    if (!text || text.trim() === '') return;

    // 1. Chunking
    const chunks = this.chunker.chunkText(text, metadata);
    if (chunks.length === 0) return;

    // 2. Embedding (Batch)
    const chunkTexts = chunks.map(c => c.text);
    const embeddings = await this.embedder.embedBatch(chunkTexts);

    // 3. Merging
    const chunksWithEmbeddings = chunks.map((chunk, i) => ({
      ...chunk,
      embedding: embeddings[i]
    }));

    // 4. Indexing
    await this.store.addChunks(chunksWithEmbeddings);
  }

  /**
   * Retrieve the most relevant chunks for a given query.
   * Performs Semantic Search -> Thresholding -> Deduplication
   */
  public async retrieveContext(query: string, topK: number = 5, threshold: number = 0.5): Promise<SearchResult[]> {
    if (!query || query.trim() === '') return [];

    // 1. Embed Query
    const queryEmbedding = await this.embedder.embedText(query);

    // 2. Semantic Search
    let results = await this.store.search(queryEmbedding, topK * 2, threshold);

    // 3. Deduplication (e.g. Exact same chunk ID or heavily overlapping text)
    // For simplicity, we just take unique chunks based on ID
    const uniqueMap = new Map<string, SearchResult>();
    for (const res of results) {
      if (!uniqueMap.has(res.id)) {
        uniqueMap.set(res.id, res);
      }
    }
    
    results = Array.from(uniqueMap.values());
    
    // Sort and limit
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }

  /**
   * Remove a document and all its chunks from the RAG index
   */
  public async removeDocument(documentId: string): Promise<void> {
    await this.store.removeDocument(documentId);
  }
}
