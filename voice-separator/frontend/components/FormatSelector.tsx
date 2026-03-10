"use client";

interface FormatSelectorProps {
  value: string;
  onChange: (format: string) => void;
}

const formats = [
  { value: "wav", label: "WAV", desc: "无损音质" },
  { value: "mp3", label: "MP3", desc: "体积更小" },
];

export default function FormatSelector({ value, onChange }: FormatSelectorProps) {
  return (
    <div>
      <label className="block text-gray-400 text-sm mb-2">输出格式</label>
      <div className="flex gap-3">
        {formats.map((fmt) => (
          <button
            key={fmt.value}
            onClick={() => onChange(fmt.value)}
            className={`
              flex-1 py-3 px-4 rounded-xl border-2 transition-all text-center
              ${
                value === fmt.value
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-gray-700 bg-gray-900/50 text-gray-400 hover:border-gray-500"
              }
            `}
          >
            <span className="font-semibold">{fmt.label}</span>
            <span className="block text-xs mt-0.5 opacity-70">{fmt.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
