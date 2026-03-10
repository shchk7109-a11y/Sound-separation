"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";

interface UploadZoneProps {
  apiUrl: string;
  onUploadComplete: (taskId: string, fileName: string) => void;
  fileName: string;
  disabled: boolean;
}

const ALLOWED_TYPES = [".mp3", ".wav", ".m4a"];
const MAX_SIZE = 200 * 1024 * 1024; // 200MB

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadZone({
  apiUrl,
  onUploadComplete,
  fileName,
  disabled,
}: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_TYPES.includes(ext)) {
      return `不支持的文件格式 "${ext}"，请上传 MP3、WAV 或 M4A 文件`;
    }
    if (file.size > MAX_SIZE) {
      return `文件大小 ${formatSize(file.size)} 超过 200MB 限制`;
    }
    return null;
  };

  const uploadFile = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const xhr = new XMLHttpRequest();

      await new Promise<void>((resolve, reject) => {
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100));
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            try {
              const err = JSON.parse(xhr.responseText);
              reject(new Error(err.detail || "上传失败"));
            } catch {
              reject(new Error("上传失败"));
            }
          }
        });

        xhr.addEventListener("error", () => reject(new Error("网络错误")));
        xhr.open("POST", `${apiUrl}/api/upload`);
        xhr.send(formData);
      });

      const data = JSON.parse(xhr.responseText);
      onUploadComplete(data.task_id, file.name);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "上传失败";
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && !uploading && inputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer
          transition-all duration-300
          ${isDragging ? "upload-zone-active" : "border-gray-700 hover:border-gray-500"}
          ${disabled ? "opacity-60 cursor-default" : ""}
          ${uploading ? "cursor-wait" : ""}
          bg-gray-900/50
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".mp3,.wav,.m4a"
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled || uploading}
        />

        {!uploading && !fileName && (
          <>
            <div className="text-5xl mb-4 opacity-60">
              <svg className="w-16 h-16 mx-auto text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-gray-300 text-lg mb-2">拖拽上传或点击选择文件</p>
            <p className="text-gray-500 text-sm">
              支持 MP3 / WAV / M4A · 最大 200MB
            </p>
          </>
        )}

        {uploading && (
          <div>
            <p className="text-gray-300 text-lg mb-3">正在上传...</p>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div
                className="h-2 rounded-full gradient-primary progress-bar-fill"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-gray-500 text-sm mt-2">{uploadProgress}%</p>
          </div>
        )}

        {!uploading && fileName && (
          <div>
            <svg className="w-10 h-10 mx-auto text-accent mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            <p className="text-accent font-medium">{fileName}</p>
            <p className="text-gray-500 text-sm mt-1">文件已上传，请选择输出格式并开始分离</p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-red-400 text-sm mt-3 text-center">{error}</p>
      )}
    </div>
  );
}
