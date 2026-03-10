"use client";

interface ProgressBarProps {
  progress: number;
  message: string;
}

export default function ProgressBar({ progress, message }: ProgressBarProps) {
  return (
    <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-8">
      <h3 className="text-gray-300 font-medium mb-4 text-center text-lg">
        处理进度
      </h3>

      <div className="w-full bg-gray-800 rounded-full h-3 mb-3">
        <div
          className="h-3 rounded-full gradient-primary progress-bar-fill"
          style={{ width: `${Math.max(progress, 2)}%` }}
        />
      </div>

      <div className="flex justify-between items-center">
        <p className="text-gray-400 text-sm">{message}</p>
        <p className="text-accent font-semibold text-lg">{progress}%</p>
      </div>

      {progress < 100 && (
        <div className="mt-6 flex justify-center">
          <div className="flex gap-1.5">
            <span className="w-2 h-2 bg-accent rounded-full animate-bounce [animation-delay:0ms]" />
            <span className="w-2 h-2 bg-accent rounded-full animate-bounce [animation-delay:150ms]" />
            <span className="w-2 h-2 bg-accent rounded-full animate-bounce [animation-delay:300ms]" />
          </div>
        </div>
      )}
    </div>
  );
}
