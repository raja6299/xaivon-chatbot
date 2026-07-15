import { EmbeddingProvider } from '../types';

export class MockEmbeddingProvider implements EmbeddingProvider {
  private dimension: number;

  constructor(dimension: number = 384) {
    this.dimension = dimension;
  }

  public getDimension(): number {
    return this.dimension;
  }

  public async embedText(text: string): Promise<number[]> {
    // Generate a pseudo-random but deterministic embedding based on the text hash
    const embedding = new Array(this.dimension).fill(0);
    if (!text) return embedding;

    // Simple hash to seed
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) - hash) + text.charCodeAt(i);
      hash |= 0; 
    }

    // Generate pseudo-random normalized vector
    let sum = 0;
    for (let i = 0; i < this.dimension; i++) {
      const val = Math.sin(hash + i);
      embedding[i] = val;
      sum += val * val;
    }

    const norm = Math.sqrt(sum);
    if (norm > 0) {
      for (let i = 0; i < this.dimension; i++) {
        embedding[i] /= norm;
      }
    }

    return embedding;
  }

  public async embedBatch(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map(t => this.embedText(t)));
  }
}
