import React from 'react';
import { UploadedFile } from '../../lib/files/types';
import { X, FileText, Image as ImageIcon, FileSpreadsheet, Presentation, File, AlertCircle, Loader2, RefreshCcw } from 'lucide-react';

interface AttachmentCardProps {
  file: UploadedFile;
  onRemove: (id: string) => void;
  onRetry?: (id: string) => void;
}

export function AttachmentCard({ file, onRemove, onRetry }: AttachmentCardProps) {
  const getIcon = () => {
    switch (file.type) {
      case 'image': return <ImageIcon className="w-5 h-5" />;
      case 'document': return <FileText className="w-5 h-5" />;
      case 'spreadsheet': return <FileSpreadsheet className="w-5 h-5" />;
      case 'presentation': return <Presentation className="w-5 h-5" />;
      default: return <File className="w-5 h-5" />;
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div className="relative group flex items-center gap-3 bg-[#151d35] border border-violet-500/15 p-2 pr-8 rounded-xl shadow-sm shadow-violet-500/5 hover:border-violet-500/30 transition-all duration-200 min-w-[200px] max-w-[280px]">
      
      {/* Icon / Preview */}
      <div className="w-10 h-10 shrink-0 bg-[#0a0e1a] rounded-lg border border-violet-500/10 flex items-center justify-center overflow-hidden relative">
        {file.type === 'image' && file.previewUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={file.previewUrl} alt={file.name} className="w-full h-full object-cover" />
        ) : (
          <div className="text-violet-400">
            {getIcon()}
          </div>
        )}
        {file.status === 'processing' && (
          <div className="absolute inset-0 bg-[#0a0e1a]/60 backdrop-blur-[1px] flex items-center justify-center">
            <Loader2 className="w-4 h-4 text-violet-300 animate-spin" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-white truncate">{file.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-slate-400">{formatSize(file.size)}</span>
          
          {file.status === 'error' && (
            <span className="text-[10px] text-red-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Failed
            </span>
          )}
          {file.status === 'processing' && (
             <span className="text-[10px] text-violet-300">Processing...</span>
          )}
        </div>

        {/* Progress Bar */}
        {(file.status === 'uploading' || file.status === 'processing') && (
          <div className="w-full h-1 bg-white/5 rounded-full mt-1.5 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-300" 
              style={{ width: `${file.progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
        {file.status === 'error' && onRetry && (
          <button
            type="button"
            onClick={() => onRetry(file.id)}
            className="w-6 h-6 flex items-center justify-center text-red-400 hover:text-white hover:bg-red-500/20 rounded-md transition-colors"
            aria-label="Retry"
          >
            <RefreshCcw className="w-3 h-3" />
          </button>
        )}
        <button
          type="button"
          onClick={() => onRemove(file.id)}
          className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"
          aria-label="Remove attachment"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

    </div>
  );
}
