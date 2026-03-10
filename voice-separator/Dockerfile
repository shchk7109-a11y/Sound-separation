# 阶段1: Node.js 构建
FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 阶段2: 运行时（Node + Python + ffmpeg）
FROM node:20-slim AS runner
WORKDIR /app

# 安装 Python 和 ffmpeg
RUN apt-get update && \
    apt-get install -y python3 python3-pip python3-venv ffmpeg && \
    rm -rf /var/lib/apt/lists/*

# 创建 Python 虚拟环境并安装依赖
RUN python3 -m venv /opt/venv
COPY scripts/requirements.txt /tmp/requirements.txt
RUN /opt/venv/bin/pip install --no-cache-dir -r /tmp/requirements.txt

# 确保虚拟环境在 PATH 中
ENV PATH="/opt/venv/bin:$PATH"

# 复制构建产物
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./next.config.js
COPY scripts ./scripts

# 创建临时目录
RUN mkdir -p /tmp/voice-separator/uploads /tmp/voice-separator/outputs

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["npm", "start"]
