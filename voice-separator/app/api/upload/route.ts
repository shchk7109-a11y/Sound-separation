import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const UPLOAD_DIR = "/tmp/voice-separator/uploads";
const MAX_SIZE = 200 * 1024 * 1024; // 200MB
const ALLOWED_EXT = [".mp3", ".wav", ".m4a"];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "请选择文件" }, { status: 400 });
    }

    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) {
      return NextResponse.json(
        { error: `不支持的文件格式 "${ext}"，请上传 MP3、WAV 或 M4A 文件` },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.length > MAX_SIZE) {
      return NextResponse.json(
        { error: "文件大小超过 200MB 限制" },
        { status: 400 }
      );
    }

    const taskId = uuidv4();
    const taskDir = path.join(UPLOAD_DIR, taskId);
    await mkdir(taskDir, { recursive: true });

    const filePath = path.join(taskDir, `input${ext}`);
    await writeFile(filePath, buffer);

    return NextResponse.json({
      taskId,
      filename: file.name,
      size: buffer.length,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "上传失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
