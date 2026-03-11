"""
核心语音分离脚本
用法: python separate.py <input_audio> <output_dir> <output_format> <task_status_file> [language]

处理流程:
1. 将音频上传到 AssemblyAI 进行转录 + 说话人日志化
2. 获取每个 utterance 的 speaker 标签和时间戳
3. 用 pydub 从原音频中按时间段切出片段
4. 按说话人拼接并导出
"""

import assemblyai as aai
import sys
import os
import json
# Manus AI: Added a comment to force rebuild and ensure latest code is used. (2026-03-11)
from pydub import AudioSegment


def update_status(status_file, progress, message, status="processing", result=None):
    """更新状态文件，供 Node.js API 读取"""
    data = {
        "status": status,
        "progress": progress,
        "message": message,
    }
    if result:
        data["result"] = result
    with open(status_file, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False)


def separate(input_path, output_dir, output_format, status_file, language="zh"):
    api_key = os.getenv("ASSEMBLYAI_API_KEY")
    if not api_key:
        update_status(status_file, 0, "错误：未设置 ASSEMBLYAI_API_KEY 环境变量", "error")
        return

    aai.settings.api_key = api_key

    try:
        # 1. 加载原始音频（用于后续切分）
        update_status(status_file, 5, "正在加载音频文件...")
        audio = AudioSegment.from_file(input_path)
        total_duration_sec = len(audio) / 1000.0
        update_status(status_file, 10, f"音频加载完成，时长 {total_duration_sec:.1f} 秒")

        # 2. 调用 AssemblyAI 转录 + 说话人日志化
        update_status(status_file, 15, "正在上传音频到 AssemblyAI...")

        config_params = {
            "speaker_labels": True,
            "speakers_expected": 2,
        }

        if language == "auto":
            config_params["language_detection"] = True
            config_params["speech_models"] = ["universal-3-pro", "universal-2"]
        elif language == "en":
            config_params["language_code"] = language
            config_params["speech_models"] = ["universal-3-pro", "universal-2"]
        else:
            config_params["language_code"] = language
            config_params["speech_models"] = ["universal-3-pro", "universal-2"]

        config = aai.TranscriptionConfig(**config_params)

        transcriber = aai.Transcriber()
        update_status(status_file, 20, "正在进行说话人识别（这一步耗时最长，请耐心等待）...")

        transcript = transcriber.transcribe(input_path, config=config)

        if transcript.status == aai.TranscriptStatus.error:
            update_status(status_file, 0, f"AssemblyAI 转录失败: {transcript.error}", "error")
            return

        update_status(status_file, 60, "说话人识别完成，正在切分音频...")

        # 3. 从 utterances 中提取每个说话人的时间段
        speaker_segments = {}

        if not transcript.utterances:
            update_status(status_file, 0, "未能识别出说话人信息，请确认音频中包含两人对话", "error")
            return

        for utterance in transcript.utterances:
            speaker = utterance.speaker
            if speaker not in speaker_segments:
                speaker_segments[speaker] = []
            speaker_segments[speaker].append((utterance.start, utterance.end))

        speakers = list(speaker_segments.keys())
        if len(speakers) < 2:
            update_status(status_file, 0, "只识别出一个说话人，请确认音频中包含两人对话", "error")
            return

        # 4. 为每个说话人切分并拼接音频
        result = {}
        for i, speaker in enumerate(speakers[:2]):
            update_status(status_file, 70 + i * 12, f"正在处理说话人 {i + 1} 的音频...")

            segments = speaker_segments[speaker]
            combined = AudioSegment.empty()

            for start_ms, end_ms in segments:
                chunk = audio[start_ms:end_ms]
                combined += chunk + AudioSegment.silent(duration=100)

            # 移除末尾多余的静音
            if len(combined) > 100:
                combined = combined[:-100]

            # 导出
            filename = f"speaker_{i + 1}.{output_format}"
            output_path = os.path.join(output_dir, filename)

            if output_format == "mp3":
                combined.export(output_path, format="mp3", bitrate="192k")
            else:
                combined.export(output_path, format="wav")

            result[f"speaker_{i + 1}"] = {
                "filename": filename,
                "duration": round(len(combined) / 1000.0, 1),
                "segments_count": len(segments),
            }

        update_status(status_file, 100, "处理完成！", "completed", result)

    except Exception as e:
        update_status(status_file, 0, f"处理出错: {str(e)}", "error")


if __name__ == "__main__":
    if len(sys.argv) < 5:
        print("用法: python separate.py <input_audio> <output_dir> <output_format> <status_file> [language]")
        sys.exit(1)

    input_path = sys.argv[1]
    output_dir = sys.argv[2]
    output_format = sys.argv[3]
    status_file = sys.argv[4]
    language = sys.argv[5] if len(sys.argv) > 5 else "zh"

    os.makedirs(output_dir, exist_ok=True)
    separate(input_path, output_dir, output_format, status_file, language)
