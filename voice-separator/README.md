# 播客语音分离器

上传播客音频，智能识别并分离两位嘉宾的语音，输出为两个独立的音频文件。

## 功能

- 上传音频文件（支持 MP3、WAV、M4A）
- 自动识别两位说话人（基于 AssemblyAI）
- 分离并导出各说话人的独立音频
- 支持输出为 MP3 或 WAV 格式
- 支持中文、英文、自动检测语言
- 在线试听分离结果
- 最大支持 200MB / 30 分钟音频

## 技术栈

- **前端 + 后端**：Next.js 14 (App Router) + TypeScript + TailwindCSS
- **音频处理**：Python 脚本（AssemblyAI SDK + pydub + ffmpeg）
- **部署**：Docker 单服务 → Railway

## 快速开始

### 前提条件

1. 安装 [Docker](https://docs.docker.com/get-docker/)
2. 获取 AssemblyAI API Key：
   - 注册 [AssemblyAI](https://www.assemblyai.com/)（新用户送 $50 额度）
   - 在控制台获取 API Key

### Docker 启动

```bash
# 构建并运行
docker build -t voice-separator .
docker run -p 3000:3000 -e ASSEMBLYAI_API_KEY=你的key voice-separator
```

访问 http://localhost:3000

### 本地开发

```bash
# 安装 Python 依赖
pip install -r scripts/requirements.txt

# 安装 Node 依赖
npm install

# 设置环境变量
export ASSEMBLYAI_API_KEY=你的key

# 启动开发服务器
npm run dev
```

## 部署到 Railway

1. 在 Railway 创建新项目，关联 GitHub 仓库
2. 在 Variables 中添加 `ASSEMBLYAI_API_KEY`
3. 等构建完成即可使用

## 注意事项

- AssemblyAI 新用户送 $50 额度，约可处理 400 小时音频
- 10 分钟音频大约 1-2 分钟出结果（云端处理，不吃本地资源）
- 此方案只需约 512MB 内存，Railway Hobby 计划即可
- 需要本地安装 ffmpeg（Docker 镜像已包含）
