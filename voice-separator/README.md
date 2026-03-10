# 播客语音分离器

上传播客音频，智能识别并分离两位嘉宾的语音，输出为两个独立的音频文件。

## 功能

- 上传音频文件（支持 MP3、WAV、M4A）
- 自动识别两位说话人
- 分离并导出各说话人的独立音频
- 支持输出为 MP3 或 WAV 格式
- 在线试听分离结果
- 最大支持 200MB / 30 分钟音频

## 技术栈

- **前端**：Next.js 14 + TypeScript + TailwindCSS
- **后端**：FastAPI + pyannote.audio（说话人日志化）+ pydub（音频处理）
- **部署**：Docker Compose

## 快速开始

### 前提条件

1. 安装 [Docker](https://docs.docker.com/get-docker/) 和 Docker Compose
2. 获取 Hugging Face Token：
   - 注册 [Hugging Face](https://huggingface.co/) 账号
   - 访问 [pyannote/speaker-diarization-3.1](https://huggingface.co/pyannote/speaker-diarization-3.1) 并接受使用协议
   - 在 [设置页](https://huggingface.co/settings/tokens) 创建 Access Token

### 启动

```bash
# 1. 复制环境变量文件并填入 HF_TOKEN
cp .env.example .env

# 2. 启动服务
docker-compose up --build
```

启动后访问 http://localhost:3000 即可使用。

### 本地开发

```bash
# 后端
cd backend
pip install -r requirements.txt
HF_TOKEN=你的token uvicorn main:app --reload --port 8000

# 前端
cd frontend
npm install
npm run dev
```

## 部署到 Railway

1. 在 Railway 创建新项目
2. 设置环境变量 `HF_TOKEN`
3. 推荐使用 Pro plan（至少 4GB 内存）
4. 首次启动会下载约 1GB 模型文件

## 注意事项

- pyannote.audio 模型需要至少 4GB 内存
- 无 GPU 环境下，10 分钟音频处理约需 5-10 分钟
- 首次运行会自动下载模型并缓存
