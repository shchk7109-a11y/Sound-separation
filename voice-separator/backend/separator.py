"""
核心语音分离模块
使用 pyannote.audio 进行说话人日志化（Speaker Diarization），
然后按说话人分割并拼接音频片段。
"""

from pyannote.audio import Pipeline
from pydub import AudioSegment
import os
import torch
from typing import Callable, Optional


def separate_speakers(
    input_path: str,
    output_dir: str,
    output_format: str = "wav",
    hf_token: str = None,
    progress_callback: Optional[Callable[[int, str], None]] = None,
) -> dict:
    """
    分离音频中的两个说话人

    参数:
        input_path: 输入音频文件路径
        output_dir: 输出目录
        output_format: 输出格式 "wav" 或 "mp3"
        hf_token: Hugging Face API token
        progress_callback: 进度回调 fn(percent: int, message: str)

    返回:
        {
            "speaker_1": {"path": ..., "duration": ..., "segments_count": ...},
            "speaker_2": {"path": ..., "duration": ..., "segments_count": ...},
            "total_duration": float
        }
    """

    def report(percent: int, message: str):
        if progress_callback:
            progress_callback(percent, message)

    report(5, "正在加载音频文件...")

    audio = AudioSegment.from_file(input_path)
    total_duration = len(audio) / 1000.0

    report(10, "正在初始化说话人识别模型...")

    pipeline = Pipeline.from_pretrained(
        "pyannote/speaker-diarization-3.1",
        use_auth_token=hf_token,
    )

    if torch.cuda.is_available():
        pipeline.to(torch.device("cuda"))

    report(20, "正在分析说话人...")

    diarization = pipeline(input_path, num_speakers=2)

    report(70, "正在分离音频...")

    speaker_segments: dict[str, list[dict]] = {}
    for turn, _, speaker in diarization.itertracks(yield_label=True):
        if speaker not in speaker_segments:
            speaker_segments[speaker] = []
        speaker_segments[speaker].append({
            "start": turn.start * 1000,
            "end": turn.end * 1000,
        })

    speakers = list(speaker_segments.keys())
    if len(speakers) < 2:
        raise ValueError("未能识别出两个不同的说话人，请确认音频中包含两人对话")

    results = {}
    for i, speaker in enumerate(speakers[:2]):
        segments = speaker_segments[speaker]
        combined = AudioSegment.empty()

        for seg in segments:
            chunk = audio[seg["start"]:seg["end"]]
            combined += chunk + AudioSegment.silent(duration=50)

        speaker_label = f"speaker_{i + 1}"
        output_filename = f"{speaker_label}.{output_format}"
        output_path = os.path.join(output_dir, output_filename)

        if output_format == "mp3":
            combined.export(output_path, format="mp3", bitrate="192k")
        else:
            combined.export(output_path, format="wav")

        results[speaker_label] = {
            "path": output_path,
            "duration": len(combined) / 1000.0,
            "segments_count": len(segments),
        }

        report(80 + i * 10, f"说话人 {i + 1} 音频导出完成")

    report(100, "处理完成！")

    return {
        "speaker_1": results.get("speaker_1", {}),
        "speaker_2": results.get("speaker_2", {}),
        "total_duration": total_duration,
    }
