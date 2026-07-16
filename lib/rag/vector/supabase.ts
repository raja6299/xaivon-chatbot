import { ChunkWithEmbedding, DocumentMetadata, SearchResult, VectorStore } from '../types';
import { createClient } from '@supabase/supabase-js';

export class SupabaseVectorStore implements VectorStore {
  private supabase: ReturnType<typeof createClient>;

  constructor() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    
    // Fallback for missing env during build
    this.supabase = createClient(
      url || 'https://your_supabase_project.supabase.co',
      key || 'your_supabase_key'
    );
  }

  async addChunks(chunks: ChunkWithEmbedding[]): Promise<void> {
    if (chunks.length === 0) return;

    const deterministicUuid = '00000000-0000-0000-0000-000000000001';
    
    // Ensure the doc exists
    await (this.supabase as any).from('knowledge_docs').upsert({
      id: deterministicUuid,
      title: chunks[0]?.metadata.documentName || 'Unknown Document',
      storage_path: 'internal',
      status: 'processed'
    });

    const rows = chunks.map(chunk => ({
      doc_id: deterministicUuid,
      content: chunk.text,
      embedding: chunk.embedding,
      metadata: chunk.metadata,
    }));

    const { error } = await (this.supabase as any).from('knowledge_chunks').insert(rows);
    if (error) {
      console.error('Failed to add chunks to Supabase:', error);
    }
  }

  async search(embedding: number[], topK: number, threshold = 0.5): Promise<SearchResult[]> {
    // @ts-expect-error: TS infers undefined because Database types are missing
    const { data, error } = await this.supabase.rpc('match_knowledge_chunks', {
      query_embedding: embedding,
      match_threshold: threshold,
      match_count: topK,
    });

    if (error || !data) {
      console.error('Failed to search chunks in Supabase:', error);
      return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any[]).map((item: Record<string, unknown>) => ({
      id: item.id as string,
      text: item.content as string,
      metadata: item.metadata as DocumentMetadata,
      score: item.similarity as number,
    }));
  }

  async removeDocument(documentId: string): Promise<void> {
    const deterministicUuid = documentId === 'internal-kb-001' 
      ? '00000000-0000-0000-0000-000000000001' 
      : documentId;

    await (this.supabase as any)
      .from('knowledge_docs')
      .delete()
      .eq('id', deterministicUuid);
  }
}
