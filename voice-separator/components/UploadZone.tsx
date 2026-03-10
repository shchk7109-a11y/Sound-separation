"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";

interface UploadZoneProps {
  onFileSelected: (name: string, size: number) => void;
  onUploadStart: () => void;
  onUploadComplete: (taskId: string) => void;
  onError: (message: string) => void;
  disabled: boolean;
  uploading: boolean;
}

const ALLOWED_EXT = [".mp3", ".wav", ".m4a"];
const MAX_SIZE = 200 * 1024 * 1024;

export default function UploadZone({
  onFileSelected,
  onUploadStart,
  onUploadComplete,
  onError,
  disabled,
  uploading,
}: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndUpload = async (file: File) => {
    const ext = "." + (file.name.split(".").pop()?.toLowerCase() || "");
    if (!ALLOWED_EXT.includes(ext)) {
      onError(`不支持的文件格式 "${ext}"，请上传 MP3、WAV 或 M4A 文件`);
      return;
    }
    if (file.size > MAX_SIZE) {
      onError("文件大小超过 200MB 限制");
      return;
    }

    onFileSelected(file.name, file.size);
    onUploadStart();
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100));
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(xhr.responseText);
          } else {
            try {
              const err = JSON.parse(xhr.responseText);
              reject(new Error(err.error || "上传失败"));
            } catch {
              reject(new Error("上传失败"));
            }
          }
        });

        xhr.addEventListener("error", () => reject(new Error("网络错误")));
        xhr.open("POST", "/api/upload");
        xhr.send(formData);
      });

      const data = JSON.parse(response);
      onUploadComplete(data.taskId);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "上传失败";
      onError(msg);
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    if (!disabled && !uploading) setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || uploading) return;
    const file = e.dataTransfer.files[0];
    if (file) validateAndUpload(file);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndUpload(file);
    if (inputRef.current) inputRef.current.value = "";
  };

  if (disabled) return null;

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !uploading && inputRef.current?.click()}
      className={`
        relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300
        ${isDragging ? "upload-zone-active" : "border-gray-700 hover:border-gray-500"}
        ${uploading ? "cursor-wait" : "cursor-pointer"}
        bg-gray-900/50
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".mp3,.wav,.m4a"
        onChange={handleFileChange}
        className="hidden"
        disabled={uploading}
      />

      {!uploading ? (
        <>
          <svg className="w-16 h-16 mx-auto text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-gray-300 text-lg mb-2">拖拽音频文件到这里，或点击选择</p>
          <p className="text-gray-500 text-sm">支持 MP3 / WAV / M4A · 最大 200MB</p>
        </>
      ) : (
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
    </div>
  );
}
