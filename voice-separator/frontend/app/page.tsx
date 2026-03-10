"use client";

import { useState } from "react";
import UploadZone from "@/components/UploadZone";
import FormatSelector from "@/components/FormatSelector";
import ProgressBar from "@/components/ProgressBar";
import ResultPanel from "@/components/ResultPanel";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface TaskResult {
  speaker_1: { path: string; duration: number; segments_count: number };
  speaker_2: { path: string; duration: number; segments_count: number };
  total_duration: number;
}

type AppState = "idle" | "uploaded" | "processing" | "completed" | "error";

export default function Home() {
  const [state, setState] = useState<AppState>("idle");
  const [taskId, setTaskId] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [outputFormat, setOutputFormat] = useState<string>("wav");
  const [progress, setProgress] = useState<number>(0);
  const [progressMessage, setProgressMessage] = useState<string>("");
  const [result, setResult] = useState<TaskResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleUploadComplete = (id: string, name: string) => {
    setTaskId(id);
    setFileName(name);
    setState("uploaded");
    setErrorMessage("");
  };

  const pollStatus = async (id: string) => {
    const poll = async () => {
      try {
        const res = await fetch(`${API_URL}/api/status/${id}`);
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

        setTimeout(poll, 1500);
      } catch {
        setTimeout(poll, 3000);
      }
    };

    poll();
  };

  const handleStartProcessing = async () => {
    if (!taskId) return;

    setState("processing");
    setProgress(0);
    setProgressMessage("正在启动处理...");

    try {
      const res = await fetch(
        `${API_URL}/api/process?task_id=${taskId}&output_format=${outputFormat}`,
        { method: "POST" }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "处理启动失败");
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
    setProgress(0);
    setProgressMessage("");
    setResult(null);
    setErrorMessage("");
  };

  return (
    <main className="min-h-screen bg-gray-950 flex flex-col items-center px-4 py-8 md:py-16">
      <div className="w-full max-w-2xl">
        {/* 标题 */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-3">
            播客语音分离器
          </h1>
          <p className="text-gray-400 text-base md:text-lg">
            上传播客音频，智能分离两位嘉宾的语音
          </p>
        </div>

        {/* 上传区域 */}
        {(state === "idle" || state === "uploaded") && (
          <>
            <UploadZone
              apiUrl={API_URL}
              onUploadComplete={handleUploadComplete}
              fileName={fileName}
              disabled={state === "uploaded"}
            />

            {state === "uploaded" && (
              <div className="mt-6 space-y-4">
                <FormatSelector
                  value={outputFormat}
                  onChange={setOutputFormat}
                />
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
            apiUrl={API_URL}
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
        <footer className="mt-12 text-center text-gray-600 text-sm">
          <p>支持 MP3 / WAV / M4A 格式 · 最大 200MB · 最长 30 分钟</p>
        </footer>
      </div>
    </main>
  );
}
