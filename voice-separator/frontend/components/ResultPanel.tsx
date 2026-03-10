"use client";

import AudioPlayer from "./AudioPlayer";

interface SpeakerResult {
  path: string;
  duration: number;
  segments_count: number;
}

interface TaskResult {
  speaker_1: SpeakerResult;
  speaker_2: SpeakerResult;
  total_duration: number;
}

interface ResultPanelProps {
  result: TaskResult;
  taskId: string;
  apiUrl: string;
  outputFormat: string;
  onReset: () => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}分${s.toString().padStart(2, "0")}秒`;
}

export default function ResultPanel({
  result,
  taskId,
  apiUrl,
  outputFormat,
  onReset,
}: ResultPanelProps) {
  const speakers = [
    { key: "1", label: "说话人 1", data: result.speaker_1 },
    { key: "2", label: "说话人 2", data: result.speaker_2 },
  ];

  const downloadUrl = (speaker: string) =>
    `${apiUrl}/api/download/${taskId}/${speaker}`;

  const handleDownloadAll = () => {
    speakers.forEach(({ key }) => {
      const a = document.createElement("a");
      a.href = downloadUrl(key);
      a.download = `说话人${key}.${outputFormat}`;
      a.click();
    });
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-2">
        <h3 className="text-lg font-semibold text-gray-200">分离完成</h3>
        <p className="text-gray-500 text-sm">
          原始音频时长：{formatDuration(result.total_duration)}
        </p>
      </div>

      {speakers.map(({ key, label, data }) => (
        <div
          key={key}
          className="bg-gray-900/70 border border-gray-800 rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              <span className="text-gray-200 font-medium">{label}</span>
            </div>
            <a
              href={downloadUrl(key)}
              download
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-accent/10 text-accent
                hover:bg-accent/20 transition-colors text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              下载
            </a>
          </div>

          <AudioPlayer
            src={downloadUrl(key)}
            label={label}
          />

          <div className="flex gap-4 mt-3 text-xs text-gray-500">
            <span>片段数：{data.segments_count}</span>
            <span>时长：{formatDuration(data.duration)}</span>
          </div>
        </div>
      ))}

      <div className="flex gap-3 pt-2">
        <button
          onClick={handleDownloadAll}
          className="flex-1 py-3 rounded-xl font-semibold text-white gradient-primary
            hover:opacity-90 transition-opacity"
        >
          全部下载
        </button>
        <button
          onClick={onReset}
          className="px-6 py-3 rounded-xl border border-gray-700 text-gray-400
            hover:border-gray-500 hover:text-gray-300 transition-colors"
        >
          重新开始
        </button>
      </div>
    </div>
  );
}
