export type FileType = 'image' | 'document' | 'spreadsheet' | 'presentation' | 'text' | 'unknown';
export type FileStatus = 'uploading' | 'processing' | 'ready' | 'error';

export interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: FileType;
  status: FileStatus;
  progress: number;
  previewUrl?: string; // For images (base64)
  extractedText?: string; // For documents
  error?: string;
}

export const SUPPORTED_EXTENSIONS = [
  'pdf', 'docx', 'txt', 'csv', 'xlsx', 'pptx',
  'png', 'jpg', 'jpeg', 'webp'
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
