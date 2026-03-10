"use client";

import { useState, useCallback } from "react";
import UploadZone from "@/components/UploadZone";
import ProgressBar from "@/components/ProgressBar";
import ResultPanel from "@/components/ResultPanel";

interface SpeakerData {
  filename: string;
  duration: number;
  segments_count: number;
}

interface TaskResult {
  speaker_1: SpeakerData;
  speaker_2: SpeakerData;
}

type AppState = "idle" | "uploaded" | "uploading" | "processing" | "completed" | "error";

export default function Home() {
  const [state, setState] = useState<AppState>("idle");
  const [taskId, setTaskId] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [outputFormat, setOutputFormat] = useState("wav");
  const [language, setLanguage] = useState("zh");
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [result, setResult] = useState<TaskResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const handleFileSelected = useCallback(
    (name: string, size: number) => {
      setFileName(name);
      setFileSize(size);
    },
    []
  );

  const handleUploadComplete = useCallback(
    (id: string) => {
      setTaskId(id);
      setState("uploaded");
      setErrorMessage("");
    },
    []
  );

  const handleUploadStart = useCallback(() => {
    setState("uploading");
  }, []);

  const handleUploadError = useCallback((msg: string) => {
    setErrorMessage(msg);
    setState("error");
  }, []);

  const pollStatus = useCallback(async (id: string) => {
    const poll = async () => {
      try {
        const res = await fetch(`/api/status/${id}`);
        const data = await res.json();

        setProgress(data.progress);
        setProgressMessage(data.message);

        if (data.status === "completed") {
          setResult(data.result);
          setState("completed");
          return;
        }

        if (data.status === "error") {
          setErrorMessage(data.message);
          setState("error");
          return;
        }

        setTimeout(poll, 2000);
      } catch {
        setTimeout(poll, 3000);
      }
    };

    poll();
  }, []);

  const handleStartProcessing = async () => {
    if (!taskId) return;

    setState("processing");
    setProgress(0);
    setProgressMessage("正在启动处理...");

    try {
      const res = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, outputFormat, language }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "处理启动失败");
      }

      pollStatus(taskId);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "未知错误";
      setErrorMessage(msg);
      setState("error");
    }
  };

  const handleReset = () => {
    setState("idle");
    setTaskId("");
    setFileName("");
    setFileSize(0);
    setProgress(0);
    setProgressMessage("");
    setResult(null);
    setErrorMessage("");
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-8 md:py-16">
      <div className="w-full max-w-2xl">
        {/* 标题 */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-3">
            播客语音分离器
          </h1>
          <p className="text-gray-400 text-base md:text-lg">
            上传播客音频，智能分离两位嘉宾的声音
          </p>
        </div>

        {/* 上传区域 */}
        {(state === "idle" || state === "uploaded" || state === "uploading") && (
          <>
            <UploadZone
              onFileSelected={handleFileSelected}
              onUploadStart={handleUploadStart}
              onUploadComplete={handleUploadComplete}
              onError={handleUploadError}
              disabled={state === "uploaded"}
              uploading={state === "uploading"}
            />

            {/* 文件信息 */}
            {state === "uploaded" && fileName && (
              <div className="mt-4 bg-gray-900/70 border border-gray-800 rounded-xl p-4 flex items-center gap-3">
                <svg className="w-8 h-8 text-accent flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                <div className="min-w-0 flex-1">
                  <p className="text-gray-200 font-medium truncate">{fileName}</p>
                  <p className="text-gray-500 text-sm">{formatSize(fileSize)}</p>
                </div>
                <button
                  onClick={handleReset}
                  className="text-gray-500 hover:text-gray-300 transition-colors p-1"
                  title="重新选择"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {/* 选项和开始按钮 */}
            {state === "uploaded" && (
              <div className="mt-6 space-y-4">
                {/* 输出格式 */}
                <div>
                  <label className="block text-gray-400 text-sm mb-2">输出格式</label>
                  <div className="flex gap-3">
                    {[
                      { value: "wav", label: "WAV", desc: "无损音质" },
                      { value: "mp3", label: "MP3", desc: "体积更小" },
                    ].map((fmt) => (
                      <button
                        key={fmt.value}
                        onClick={() => setOutputFormat(fmt.value)}
                        className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all text-center ${
                          outputFormat === fmt.value
                            ? "border-accent bg-accent/10 text-accent"
                            : "border-gray-700 bg-gray-900/50 text-gray-400 hover:border-gray-500"
                        }`}
                      >
                        <span className="font-semibold">{fmt.label}</span>
                        <span className="block text-xs mt-0.5 opacity-70">{fmt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 语言选择 */}
                <div>
                  <label className="block text-gray-400 text-sm mb-2">音频语言</label>
                  <div className="flex gap-3">
                    {[
                      { value: "zh", label: "中文" },
                      { value: "en", label: "英文" },
                      { value: "auto", label: "自动检测" },
                    ].map((lang) => (
                      <button
                        key={lang.value}
                        onClick={() => setLanguage(lang.value)}
                        className={`flex-1 py-2.5 px-3 rounded-xl border-2 transition-all text-center text-sm ${
                          language === lang.value
                            ? "border-accent bg-accent/10 text-accent"
                            : "border-gray-700 bg-gray-900/50 text-gray-400 hover:border-gray-500"
                        }`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleStartProcessing}
                  className="w-full py-3.5 rounded-xl font-semibold text-white gradient-primary
                    hover:opacity-90 transition-opacity text-lg tracking-wide"
                >
                  开始分离
                </button>
              </div>
            )}
          </>
        )}

        {/* 进度条 */}
        {state === "processing" && (
          <ProgressBar progress={progress} message={progressMessage} />
        )}

        {/* 结果面板 */}
        {state === "completed" && result && (
          <ResultPanel
            result={result}
            taskId={taskId}
            outputFormat={outputFormat}
            onReset={handleReset}
          />
        )}

        {/* 错误提示 */}
        {state === "error" && (
          <div className="bg-red-900/30 border border-red-700 rounded-xl p-6 text-center">
            <p className="text-red-300 text-lg mb-2">处理出错</p>
            <p className="text-red-400 text-sm mb-4">{errorMessage}</p>
            <button
              onClick={handleReset}
              className="px-6 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
            >
              重新开始
            </button>
          </div>
        )}

        {/* 页脚 */}
        <footer className="mt-12 text-center text-gray-600 text-xs space-y-1">
          <p>支持 MP3 / WAV / M4A 格式 · 最大 200MB · 最长 30 分钟</p>
          <p>10 分钟音频大约需要 1-2 分钟处理</p>
        </footer>
      </div>
    </main>
  );
}
