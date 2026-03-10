"""
FastAPI 后端服务
- POST /api/upload — 上传音频文件
- POST /api/process — 开始处理（异步）
- GET /api/status/{task_id} — 查询处理状态
- GET /api/download/{task_id}/{speaker} — 下载结果音频
"""

from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import uuid
import os
from separator import separate_speakers

app = FastAPI(title="语音分离服务")

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

tasks: dict[str, dict] = {}

UPLOAD_DIR = "/tmp/voice-separator/uploads"
OUTPUT_DIR = "/tmp/voice-separator/outputs"
HF_TOKEN = os.getenv("HF_TOKEN")
MAX_FILE_SIZE = int(os.getenv("MAX_UPLOAD_SIZE", 200 * 1024 * 1024))
ALLOWED_EXTENSIONS = {".mp3", ".wav", ".m4a"}

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.post("/api/upload")
async def upload_audio(file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"不支持的文件格式: {ext}，请上传 MP3、WAV 或 M4A 文件")

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(400, "文件大小超过 200MB 限制")

    task_id = str(uuid.uuid4())
    task_dir = os.path.join(UPLOAD_DIR, task_id)
    os.makedirs(task_dir, exist_ok=True)

    file_path = os.path.join(task_dir, f"input{ext}")
    with open(file_path, "wb") as f:
        f.write(content)

    tasks[task_id] = {
        "status": "uploaded",
        "progress": 0,
        "message": "文件上传成功",
        "input_path": file_path,
        "filename": file.filename,
        "file_size": len(content),
    }

    return {"task_id": task_id, "filename": file.filename, "size": len(content)}


def process_task(task_id: str, output_format: str):
    """后台处理任务"""
    task = tasks[task_id]
    task["status"] = "processing"
    output_dir = os.path.join(OUTPUT_DIR, task_id)
    os.makedirs(output_dir, exist_ok=True)

    def progress_cb(percent: int, message: str):
        task["progress"] = percent
        task["message"] = message

    try:
        result = separate_speakers(
            input_path=task["input_path"],
            output_dir=output_dir,
            output_format=output_format,
            hf_token=HF_TOKEN,
            progress_callback=progress_cb,
        )
        task["status"] = "completed"
        task["result"] = result
        task["progress"] = 100
        task["message"] = "处理完成！"
    except Exception as e:
        task["status"] = "error"
        task["message"] = f"处理失败: {str(e)}"


@app.post("/api/process")
async def start_processing(
    task_id: str = Query(...),
    output_format: str = Query("wav"),
    background_tasks: BackgroundTasks = BackgroundTasks(),
):
    if task_id not in tasks:
        raise HTTPException(404, "任务不存在")
    if output_format not in ("mp3", "wav"):
        raise HTTPException(400, "输出格式仅支持 mp3 或 wav")

    background_tasks.add_task(process_task, task_id, output_format)
    return {"task_id": task_id, "status": "processing"}


@app.get("/api/status/{task_id}")
async def get_status(task_id: str):
    if task_id not in tasks:
        raise HTTPException(404, "任务不存在")
    task = tasks[task_id]
    return {
        "status": task["status"],
        "progress": task["progress"],
        "message": task["message"],
        "result": task.get("result"),
    }


@app.get("/api/download/{task_id}/{speaker}")
async def download_result(task_id: str, speaker: str):
    if task_id not in tasks:
        raise HTTPException(404, "任务不存在")
    task = tasks[task_id]
    if task["status"] != "completed":
        raise HTTPException(400, "任务尚未完成")

    speaker_key = f"speaker_{speaker}"
    result = task.get("result", {})
    speaker_data = result.get(speaker_key)
    if not speaker_data:
        raise HTTPException(404, "说话人音频不存在")

    file_path = speaker_data["path"]
    base_name = os.path.splitext(task.get("filename", "audio"))[0]
    ext = os.path.splitext(file_path)[1]
    filename = f"说话人{speaker}_{base_name}{ext}"
    return FileResponse(file_path, filename=filename)
