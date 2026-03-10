import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

const OUTPUT_DIR = "/tmp/voice-separator/outputs";

export async function GET(
  _request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  const { taskId } = params;
  const statusFile = path.join(OUTPUT_DIR, taskId, "status.json");

  try {
    const content = await readFile(statusFile, "utf-8");
    const data = JSON.parse(content);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      {
        status: "processing",
        progress: 0,
        message: "正在启动处理...",
      },
      { status: 200 }
    );
  }
}
