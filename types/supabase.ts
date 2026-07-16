export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          role: 'admin' | 'sales' | 'support' | 'client' | 'manager'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          role?: 'admin' | 'sales' | 'support' | 'client' | 'manager'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'admin' | 'sales' | 'support' | 'client' | 'manager'
          created_at?: string
          updated_at?: string
        }
      }
      chat_sessions: {
        Row: {
          id: string
          user_id: string | null
          title: string | null
          language: string
          status: string
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          title?: string | null
          language?: string
          status?: string
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          title?: string | null
          language?: string
          status?: string
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
      }
      messages: {
        Row: {
          id: string
          session_id: string
          role: 'user' | 'assistant' | 'system' | 'tool' | 'voice'
          content: string
          language: string | null
          status: string
          token_usage: number
          latency_ms: number
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          session_id: string
          role: 'user' | 'assistant' | 'system' | 'tool' | 'voice'
          content: string
          language?: string | null
          status?: string
          token_usage?: number
          latency_ms?: number
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          session_id?: string
          role?: 'user' | 'assistant' | 'system' | 'tool' | 'voice'
          content?: string
          language?: string | null
          status?: string
          token_usage?: number
          latency_ms?: number
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
      }
      attachments: {
        Row: {
          id: string
          message_id: string
          storage_path: string
          file_name: string
          file_size: number | null
          content_type: string | null
          extraction_status: string
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          message_id: string
          storage_path: string
          file_name: string
          file_size?: number | null
          content_type?: string | null
          extraction_status?: string
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          message_id?: string
          storage_path?: string
          file_name?: string
          file_size?: number | null
          content_type?: string | null
          extraction_status?: string
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
      }
      enterprise_leads: {
        Row: {
          id: string
          session_id: string | null
          full_name: string
          email: string
          company: string | null
          phone: string | null
          pipeline_stage: string
          score: number
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          session_id?: string | null
          full_name: string
          email: string
          company?: string | null
          phone?: string | null
          pipeline_stage?: string
          score?: number
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          session_id?: string | null
          full_name?: string
          email?: string
          company?: string | null
          phone?: string | null
          pipeline_stage?: string
          score?: number
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
      }
      knowledge_docs: {
        Row: {
          id: string
          title: string
          storage_path: string
          status: string
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          title: string
          storage_path: string
          status?: string
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          title?: string
          storage_path?: string
          status?: string
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
      }
      knowledge_chunks: {
        Row: {
          id: string
          doc_id: string
          content: string
          embedding: string | null // Vector type is returned as string representation
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          doc_id: string
          content: string
          embedding?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          doc_id?: string
          content?: string
          embedding?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'
          ip_address: string | null
          user_agent: string | null
          request_id: string | null
          details: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'
          ip_address?: string | null
          user_agent?: string | null
          request_id?: string | null
          details?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          severity?: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'
          ip_address?: string | null
          user_agent?: string | null
          request_id?: string | null
          details?: Json | null
          created_at?: string
        }
      }
    }
  }
}
