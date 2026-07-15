import { ChunkWithEmbedding, SearchResult, VectorStore } from '../types';

export class MemoryVectorStore implements VectorStore {
  private store: ChunkWithEmbedding[] = [];

  public async addChunks(chunks: ChunkWithEmbedding[]): Promise<void> {
    this.store.push(...chunks);
  }

  public async search(embedding: number[], topK: number, threshold: number = 0.0): Promise<SearchResult[]> {
    const results: SearchResult[] = [];

    for (const chunk of this.store) {
      const score = this.cosineSimilarity(embedding, chunk.embedding);
      if (score >= threshold) {
        // Strip the embedding from the result to save memory
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { embedding: _, ...chunkWithoutEmbedding } = chunk;
        results.push({
          ...chunkWithoutEmbedding,
          score
        });
      }
    }

    // Sort descending by score
    results.sort((a, b) => b.score - a.score);

    return results.slice(0, topK);
  }

  public async removeDocument(documentId: string): Promise<void> {
    this.store = this.store.filter(c => c.metadata.documentId !== documentId);
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}
