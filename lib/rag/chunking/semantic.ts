import { v4 as uuidv4 } from 'uuid';
import { Chunk, DocumentMetadata } from '../types';

export class SemanticChunker {
  private chunkSize: number;
  private chunkOverlap: number;

  constructor(chunkSize: number = 1000, chunkOverlap: number = 200) {
    this.chunkSize = chunkSize;
    this.chunkOverlap = chunkOverlap;
  }

  public chunkText(text: string, metadata: DocumentMetadata): Chunk[] {
    if (!text) return [];

    // Simple overlapping window chunking for text
    const chunks: Chunk[] = [];

    // Improve chunking by splitting on natural boundaries first (paragraphs, then sentences)
    const paragraphs = text.split(/\n\s*\n/);
    
    let currentChunkText = '';

    for (let i = 0; i < paragraphs.length; i++) {
      const p = paragraphs[i].trim();
      if (!p) continue;

      if ((currentChunkText.length + p.length) > this.chunkSize && currentChunkText.length > 0) {
        // Push current chunk
        chunks.push({
          id: uuidv4(),
          text: currentChunkText.trim(),
          metadata: { ...metadata }
        });
        
        // Start new chunk with overlap from previous chunk's end
        // Simple overlap logic: take last 'chunkOverlap' characters of currentChunkText, breaking at a word
        const overlapStart = Math.max(0, currentChunkText.length - this.chunkOverlap);
        const overlapText = currentChunkText.substring(overlapStart);
        // Find first space to avoid cutting words
        const spaceIndex = overlapText.indexOf(' ');
        const finalOverlap = spaceIndex !== -1 ? overlapText.substring(spaceIndex + 1) : overlapText;
        
        currentChunkText = finalOverlap + '\n\n' + p;
      } else {
        if (currentChunkText.length > 0) {
          currentChunkText += '\n\n';
        }
        currentChunkText += p;
      }
    }

    if (currentChunkText.trim().length > 0) {
      chunks.push({
        id: uuidv4(),
        text: currentChunkText.trim(),
        metadata: { ...metadata }
      });
    }

    return chunks;
  }
}
