import { useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import {
  Upload as UploadIcon,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  File,
  Image,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { uploadDocument, type UploadedDocument } from '@/services/api';
import { cn } from '@/lib/utils';

const allowedTypes = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const maxFileSize = 10 * 1024 * 1024; // 10MB

interface FilePreview {
  file: File;
  preview?: string;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

export default function Upload() {
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>([]);

  const validateFile = (file: File): string | null => {
    if (!allowedTypes.includes(file.type)) {
      return 'File type not supported. Please upload PDF, JPG, PNG, or Excel files.';
    }
    if (file.size > maxFileSize) {
      return 'File size exceeds 10MB limit.';
    }
    return null;
  };

  const handleFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    const previews: FilePreview[] = fileArray.map((file) => {
      const error = validateFile(file);
      return {
        file,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
        status: error ? 'error' : 'pending',
        error: error || undefined,
      };
    });
    setFiles((prev) => [...prev, ...previews]);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview!);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const uploadFiles = async () => {
    const pendingFiles = files.filter((f) => f.status === 'pending');

    for (let i = 0; i < files.length; i++) {
      if (files[i].status !== 'pending') continue;

      setFiles((prev) => {
        const newFiles = [...prev];
        newFiles[i] = { ...newFiles[i], status: 'uploading' };
        return newFiles;
      });

      try {
        const doc = await uploadDocument(files[i].file);
        setUploadedDocs((prev) => [...prev, doc]);
        setFiles((prev) => {
          const newFiles = [...prev];
          newFiles[i] = { ...newFiles[i], status: 'completed' };
          return newFiles;
        });
      } catch (error) {
        setFiles((prev) => {
          const newFiles = [...prev];
          newFiles[i] = { ...newFiles[i], status: 'error', error: 'Upload failed' };
          return newFiles;
        });
      }
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return Image;
    return FileText;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const pendingCount = files.filter((f) => f.status === 'pending').length;

  return (
    <>
      <Helmet>
        <title>Upload Documents - ComplyFlow</title>
        <meta name="description" content="Upload invoices, GST returns, and other documents for AI-powered compliance analysis." />
      </Helmet>

      <div className="pt-20 lg:pt-24 pb-12 min-h-screen bg-background text-foreground transition-colors duration-300">
        <div className="container mx-auto px-4 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h1 className="text-3xl font-bold text-zinc-950 dark:text-zinc-50 tracking-tighter mb-2">Upload Documents</h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm font-inter">
              Upload invoices, GST returns, and other documents for AI-powered analysis
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Upload Area */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-2"
            >
              {/* Dropzone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={cn(
                  "relative border-2 border-dashed rounded-[2rem] p-12 lg:p-20 text-center transition-all duration-300",
                  isDragging
                    ? "border-zinc-950 dark:border-zinc-100 bg-zinc-50/50 dark:bg-zinc-800/50"
                    : "border-zinc-200/60 dark:border-zinc-800 hover:border-zinc-400/60 dark:hover:border-zinc-700 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 shadow-sm"
                )}
              >
                <input
                  type="file"
                  multiple
                  accept={allowedTypes.join(',')}
                  onChange={(e) => e.target.files && handleFiles(e.target.files)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="w-16 h-16 rounded-[1.25rem] bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-6">
                  <UploadIcon className="w-8 h-8 text-zinc-950 dark:text-zinc-100" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-bold text-zinc-950 dark:text-zinc-50 mb-3 tracking-tight">
                  Drop files here or click to browse
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8 font-inter">
                  Supports PDF, JPG, PNG, and Excel files up to 10MB
                </p>
                <Button className="bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 hover:bg-zinc-900 dark:hover:bg-zinc-200 rounded-xl text-sm font-bold px-8 py-3 h-auto shadow-lg shadow-zinc-950/10 dark:shadow-white/5 transition-all">
                  Select Files
                </Button>
              </div>

              {/* File List */}
              {files.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-zinc-950 dark:text-zinc-50 tracking-tight">Selected Files ({files.length})</h3>
                    {pendingCount > 0 && (
                      <Button className="bg-zinc-950 dark:bg-zinc-50 text-white dark:text-zinc-950 hover:bg-zinc-900 dark:hover:bg-zinc-200 rounded-xl text-xs font-bold px-5 py-2.5 h-auto transition-all" onClick={uploadFiles}>
                        Upload {pendingCount} File{pendingCount > 1 ? 's' : ''}
                      </Button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {files.map((filePreview, index) => {
                      const FileIcon = getFileIcon(filePreview.file.type);
                      return (
                        <motion.div
                          key={`${filePreview.file.name}-${index}`}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={cn(
                            "flex items-center gap-4 p-5 rounded-[1.25rem] border bg-card border-zinc-200/60 dark:border-zinc-800 shadow-sm transition-all",
                            filePreview.status === 'error' && "border-red-200/60 bg-red-50/30 dark:bg-red-950/20"
                          )}
                        >
                          {/* Preview/Icon */}
                          <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden">
                            {filePreview.preview ? (
                              <img
                                src={filePreview.preview}
                                alt="Preview"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <FileIcon className="w-6 h-6 text-zinc-500 dark:text-zinc-400" strokeWidth={1.5} />
                            )}
                          </div>

                          {/* File Info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-zinc-950 dark:text-zinc-100 truncate">{filePreview.file.name}</p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                              {formatFileSize(filePreview.file.size)}
                            </p>
                            {filePreview.error && (
                              <p className="text-xs text-red-600 mt-1">{filePreview.error}</p>
                            )}
                          </div>

                          {/* Status */}
                          <div className="flex-shrink-0">
                            {filePreview.status === 'uploading' && (
                              <Loader2 className="w-5 h-5 text-zinc-950 dark:text-zinc-100 animate-spin" strokeWidth={1.5} />
                            )}
                            {filePreview.status === 'completed' && (
                              <CheckCircle2 className="w-5 h-5 text-zinc-950 dark:text-zinc-100" strokeWidth={1.5} />
                            )}
                            {filePreview.status === 'error' && (
                              <AlertCircle className="w-5 h-5 text-red-600" strokeWidth={1.5} />
                            )}
                            {filePreview.status === 'pending' && (
                              <button
                                onClick={() => removeFile(index)}
                                className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                              >
                                <X className="w-5 h-5 text-zinc-500" strokeWidth={1.5} />
                              </button>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Instructions */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-[1.5rem] bg-card border border-zinc-200/60 dark:border-zinc-800 p-8 shadow-sm hover:shadow-md transition-all"
              >
                <h3 className="text-lg font-bold text-zinc-950 dark:text-zinc-50 mb-6 tracking-tight">Document Guidelines</h3>
                <ul className="space-y-4 text-sm text-zinc-500">
                  <li className="flex items-start gap-4">
                    <CheckCircle2 className="w-5 h-5 text-zinc-950 dark:text-zinc-100 flex-shrink-0" strokeWidth={1.5} />
                    <span className="font-inter">GST invoices must include GSTIN</span>
                  </li>
                  <li className="flex items-start gap-4">
                    <CheckCircle2 className="w-5 h-5 text-zinc-950 dark:text-zinc-100 flex-shrink-0" strokeWidth={1.5} />
                    <span className="font-inter">Ensure documents are clearly readable</span>
                  </li>
                  <li className="flex items-start gap-4">
                    <CheckCircle2 className="w-5 h-5 text-zinc-950 dark:text-zinc-100 flex-shrink-0" strokeWidth={1.5} />
                    <span className="font-inter">Scanned copies must be at least 300 DPI</span>
                  </li>
                  <li className="flex items-start gap-4">
                    <CheckCircle2 className="w-5 h-5 text-zinc-950 dark:text-zinc-100 flex-shrink-0" strokeWidth={1.5} />
                    <span className="font-inter">Max 50 pages per PDF document</span>
                  </li>
                </ul>
              </motion.div>

              {/* Supported Formats */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 p-6"
              >
                <h3 className="text-lg font-medium text-zinc-950 dark:text-zinc-100 mb-4 tracking-tight">Supported Formats</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                    <File className="w-4 h-4 text-zinc-950 dark:text-zinc-100" strokeWidth={1.5} />
                    PDF
                  </div>
                  <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                    <Image className="w-4 h-4 text-zinc-950 dark:text-zinc-100" strokeWidth={1.5} />
                    JPG/PNG
                  </div>
                  <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                    <FileText className="w-4 h-4 text-zinc-950 dark:text-zinc-100" strokeWidth={1.5} />
                    Excel
                  </div>
                </div>
              </motion.div>

              {/* Recently Uploaded */}
              {uploadedDocs.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="rounded-2xl bg-card border border-zinc-200/60 dark:border-zinc-800 p-6 hover:shadow-md transition-shadow"
                >
                  <h3 className="text-lg font-medium text-zinc-950 dark:text-zinc-100 mb-4 tracking-tight">Recently Uploaded</h3>
                  <ul className="space-y-3">
                    {uploadedDocs.slice(-3).map((doc) => (
                      <li key={doc.id} className="flex items-center gap-3 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-zinc-950 dark:text-zinc-100 flex-shrink-0" strokeWidth={1.5} />
                        <span className="truncate text-zinc-600 dark:text-zinc-400">{doc.name}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
