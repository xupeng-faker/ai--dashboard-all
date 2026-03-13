# AI Dashboard

Vue 3 + TypeScript + Vite 构建的 AI 仪表板应用。

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## Docker 使用

### 方式一：使用 GitHub Actions 自动构建（推荐）

代码推送到 main 分支后，GitHub Actions 会自动构建并推送镜像到 GitHub Container Registry。

镜像地址：`ghcr.io/xupeng-faker/ai--dashboard/ai-dashboard:latest`

### 方式二：本地构建

```bash
# 构建镜像
docker build -t ai-dashboard:latest .

# 运行容器
docker run -d -p 8080:80 ai-dashboard:latest

# 访问应用
# http://localhost:8080
```

### 推送到 Docker Hub

```bash
# 登录 Docker Hub
docker login

# 标记镜像
docker tag ai-dashboard:latest <your-dockerhub-username>/ai-dashboard:latest

# 推送镜像
docker push <your-dockerhub-username>/ai-dashboard:latest
```

## 技术栈

- Vue 3
- TypeScript
- Vite
- Element Plus
- Pinia
- Vue Router
