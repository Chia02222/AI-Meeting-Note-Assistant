import React, { useCallback, useState } from 'react';
import { UploadIcon, DocumentArrowUpIcon } from './icons';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, disabled }) => {
  const [dragging, setDragging] = useState(false);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      onFileSelect(event.target.files[0]);
      event.target.value = ''; // Reset file input
    }
  }, [onFileSelect]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragging(false);
    if (disabled) return;
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      onFileSelect(event.dataTransfer.files[0]);
    }
  }, [onFileSelect, disabled]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (disabled) return;
    setDragging(true); // Show dragging state on drag over
  }, [disabled]);

  const handleDragEnter = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (disabled) return;
    setDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    // Check if the leave target is outside the drop zone to prevent flickering
    if (event.relatedTarget && (event.currentTarget as Node).contains(event.relatedTarget as Node)) {
        return;
    }
    setDragging(false);
  }, []);


  return (
    <div className="mb-4">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        className={`w-full p-6 border-2 ${dragging && !disabled ? 'border-sky-500 bg-sky-900/30' : 'border-slate-600 border-dashed'} rounded-lg text-center ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-sky-600'} transition-colors`}
      >
        <input
          type="file"
          id="file-upload-input"
          className="hidden"
          onChange={handleFileChange}
          accept=".txt,.mp3,.wav,.m4a,.aac,audio/mpeg,audio/wav,audio/mp4,audio/x-m4a,audio/aac" // Specify extensions and MIME types
          disabled={disabled}
        />
        <label htmlFor="file-upload-input" className={`cursor-pointer ${disabled ? 'cursor-not-allowed' : ''}`}>
          <DocumentArrowUpIcon className="w-12 h-12 mx-auto text-slate-500 mb-2" />
          <p className="text-slate-400">
            <span className="font-semibold text-sky-400">Click to upload</span> or drag and drop.
          </p>
          <p className="text-xs text-slate-500">TXT, MP3, WAV, M4A, AAC files</p>
          <p className="text-xs text-slate-500 mt-1">(Audio files will be transcribed using AI.)</p>
        </label>
      </div>
    </div>
  );
};