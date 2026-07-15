import React, { useRef } from 'react';
import { Paperclip } from 'lucide-react';

interface FileUploaderProps {
  onFilesSelected: (files: FileList) => void;
  disabled?: boolean;
}

export function FileUploader({ onFilesSelected, disabled }: FileUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(e.target.files);
    }
    // Reset so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleChange}
        className="hidden"
        multiple
        accept=".pdf,.docx,.txt,.csv,.xlsx,.pptx,.png,.jpg,.jpeg,.webp"
      />
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className="w-[44px] h-[44px] text-slate-400 hover:text-white bg-[#151d35] border border-violet-500/8 hover:border-violet-500/25 rounded-xl transition-all duration-200 disabled:opacity-30 flex items-center justify-center shrink-0"
        aria-label="Upload file"
      >
        <Paperclip className="w-4 h-4" />
      </button>
    </>
  );
}
