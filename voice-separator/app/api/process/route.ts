import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import { readdir, mkdir, writeFile } from "fs/promises";
import path from "path";

const UPLOAD_DIR = "/tmp/voice-separator/uploads";
const OUTPUT_DIR = "/tmp/voice-separator/outputs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskId, outputFormat = "wav", language = "zh" } = body;

    if (!taskId) {
      return NextResponse.json({ error: "缺少 taskId" }, { status: 400 });
    }

    if (!["mp3", "wav"].includes(outputFormat)) {
      return NextResponse.json(
        { error: "输出格式仅支持 mp3 或 wav" },
        { status: 400 }
      );
    }

    // Find the uploaded input file
    const taskUploadDir = path.join(UPLOAD_DIR, taskId);
    let inputFile: string;
    try {
      const files = await readdir(taskUploadDir);
      const input = files.find((f) => f.startsWith("input"));
      if (!input) throw new Error("未找到上传文件");
      inputFile = path.join(taskUploadDir, input);
    } catch {
      return NextResponse.json({ error: "任务不存在" }, { status: 404 });
    }

    const taskOutputDir = path.join(OUTPUT_DIR, taskId);
    await mkdir(taskOutputDir, { recursive: true });

    const statusFile = path.join(taskOutputDir, "status.json");

    // Write initial status
    await writeFile(
      statusFile,
      JSON.stringify({
        status: "processing",
        progress: 0,
        message: "正在启动处理...",
      }),
      "utf-8"
    );

    // Spawn Python process in background
    const child = spawn(
      "python3",
      [
        path.join(process.cwd(), "scripts", "separate.py"),
        inputFile,
        taskOutputDir,
        outputFormat,
        statusFile,
        language,
      ],
      {
        detached: true,
        stdio: "ignore",
        env: { ...process.env },
      }
    );

    child.unref();

    return NextResponse.json({ taskId, status: "processing" });
  } catch (e) {
    const message = e instanceof Error ? e.message : "处理启动失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
