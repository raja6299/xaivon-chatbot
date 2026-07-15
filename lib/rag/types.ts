export interface DocumentMetadata {
  documentId: string;
  documentName: string;
  source: string;
  pageNumber?: number;
  section?: string;
  uploadTime: string;
}

export interface Chunk {
  id: string;
  text: string;
  metadata: DocumentMetadata;
}

export interface ChunkWithEmbedding extends Chunk {
  embedding: number[];
}

export interface SearchResult extends Chunk {
  score: number;
}

export interface VectorStore {
  addChunks(chunks: ChunkWithEmbedding[]): Promise<void>;
  search(embedding: number[], topK: number, threshold?: number): Promise<SearchResult[]>;
  removeDocument(documentId: string): Promise<void>;
}

export interface EmbeddingProvider {
  embedText(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
  getDimension(): number;
}

export interface Retriever {
  retrieve(query: string, topK?: number): Promise<SearchResult[]>;
}

export interface RAGConfig {
  chunkSize: number;
  chunkOverlap: number;
}
