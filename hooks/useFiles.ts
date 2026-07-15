import { useState, useCallback } from 'react';
import { UploadedFile, FileType, SUPPORTED_EXTENSIONS, MAX_FILE_SIZE } from '../lib/files/types';
import { v4 as uuidv4 } from 'uuid';

export function useFiles() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const getFileType = (file: File): FileType => {
    const type = file.type;
    if (type.startsWith('image/')) return 'image';
    if (type.includes('pdf')) return 'document';
    if (type.includes('wordprocessingml') || type.includes('msword')) return 'document';
    if (type.includes('spreadsheetml') || type.includes('excel') || type.includes('csv')) return 'spreadsheet';
    if (type.includes('presentationml') || type.includes('powerpoint')) return 'presentation';
    if (type.startsWith('text/')) return 'text';
    return 'unknown';
  };

  const processFile = async (fileState: UploadedFile) => {
    setFiles(prev => prev.map(f => f.id === fileState.id ? { ...f, status: 'processing' } : f));
    setIsProcessing(true);

    try {
      if (fileState.type === 'image') {
        // Read as base64 for image preview and AI submission
        const reader = new FileReader();
        const previewUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Failed to read image'));
          reader.readAsDataURL(fileState.file);
        });

        setFiles(prev => prev.map(f => f.id === fileState.id ? { 
          ...f, 
          status: 'ready', 
          progress: 100, 
          previewUrl 
        } : f));
      } else {
        // Documents: Upload to parse route
        const formData = new FormData();
        formData.append('file', fileState.file);

        // Simulate progress
        const progressInterval = setInterval(() => {
          setFiles(prev => prev.map(f => f.id === fileState.id ? { 
            ...f, 
            progress: Math.min(f.progress + 15, 90) 
          } : f));
        }, 300);

        const response = await fetch('/api/parse-document', {
          method: 'POST',
          body: formData,
        });

        clearInterval(progressInterval);

        if (!response.ok) {
          throw new Error('Failed to parse document');
        }

        const data = await response.json();
        
        setFiles(prev => prev.map(f => f.id === fileState.id ? { 
          ...f, 
          status: 'ready', 
          progress: 100, 
          extractedText: data.text 
        } : f));
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Processing failed';
      setFiles(prev => prev.map(f => f.id === fileState.id ? { 
        ...f, 
        status: 'error', 
        error: errorMessage 
      } : f));
    } finally {
      setIsProcessing(false);
    }
  };

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const validFiles: UploadedFile[] = [];

    Array.from(newFiles).forEach(file => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      
      if (!SUPPORTED_EXTENSIONS.includes(ext)) {
        alert(`Unsupported file format: ${file.name}`);
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        alert(`File too large: ${file.name}. Max 10MB.`);
        return;
      }

      const fileState: UploadedFile = {
        id: uuidv4(),
        file,
        name: file.name,
        size: file.size,
        type: getFileType(file),
        status: 'uploading',
        progress: 0,
      };

      validFiles.push(fileState);
    });

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
      validFiles.forEach(processFile);
    }
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const clearFiles = useCallback(() => {
    setFiles([]);
  }, []);

  const retryFile = useCallback((id: string) => {
    const file = files.find(f => f.id === id);
    if (file) {
      processFile(file);
    }
  }, [files]);

  return {
    files,
    isProcessing,
    addFiles,
    removeFile,
    clearFiles,
    retryFile
  };
}
