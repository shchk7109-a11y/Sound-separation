import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

const OUTPUT_DIR = "/tmp/voice-separator/outputs";

export async function GET(
  _request: NextRequest,
  { params }: { params: { taskId: string; speaker: string } }
) {
  const { taskId, speaker } = params;

  // Read status to get result info
  const statusFile = path.join(OUTPUT_DIR, taskId, "status.json");
  try {
    const content = await readFile(statusFile, "utf-8");
    const data = JSON.parse(content);

    if (data.status !== "completed") {
      return NextResponse.json({ error: "任务尚未完成" }, { status: 400 });
    }

    const speakerKey = `speaker_${speaker}`;
    const speakerData = data.result?.[speakerKey];
    if (!speakerData) {
      return NextResponse.json({ error: "说话人音频不存在" }, { status: 404 });
    }

    const filePath = path.join(OUTPUT_DIR, taskId, speakerData.filename);
    if (!existsSync(filePath)) {
      return NextResponse.json({ error: "文件不存在" }, { status: 404 });
    }

    const fileBuffer = await readFile(filePath);
    const ext = path.extname(speakerData.filename);
    const contentType = ext === ".mp3" ? "audio/mpeg" : "audio/wav";
    const downloadName = `说话人${speaker}${ext}`;

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(downloadName)}`,
        "Content-Length": fileBuffer.length.toString(),
      },
    });
  } catch {
    return NextResponse.json({ error: "任务不存在" }, { status: 404 });
  }
}
