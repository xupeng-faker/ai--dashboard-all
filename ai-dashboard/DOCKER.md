# Docker 镜像构建和上传指南

## 前置要求

1. 安装 Docker Desktop for Mac
   - 下载地址: https://www.docker.com/products/docker-desktop/
   - 安装后启动 Docker Desktop

2. 注册 Docker Hub 账号
   - 访问: https://hub.docker.com/
   - 注册并登录

## 构建和上传镜像

### 方法一：使用自动化脚本（推荐）

```bash
cd ai-dashboard
./build-and-push.sh [你的DockerHub用户名]
```

如果不提供用户名，默认使用 `xupeng-faker`

### 方法二：手动执行

```bash
cd ai-dashboard

# 1. 构建镜像
docker build -t ai-dashboard:latest .

# 2. 登录 Docker Hub
docker login

# 3. 为镜像打标签（替换为你的 DockerHub 用户名）
docker tag ai-dashboard:latest xupeng-faker/ai-dashboard:latest

# 4. 推送镜像
docker push xupeng-faker/ai-dashboard:latest
```

## 使用镜像

```bash
# 拉取镜像
docker pull xupeng-faker/ai-dashboard:latest

# 运行容器
docker run -d -p 8080:80 xupeng-faker/ai-dashboard:latest

# 访问应用
# http://localhost:8080
```

## 其他版本标签

```bash
# 构建特定版本
docker build -t ai-dashboard:v1.0.0 .
docker tag ai-dashboard:v1.0.0 xupeng-faker/ai-dashboard:v1.0.0
docker push xupeng-faker/ai-dashboard:v1.0.0
```

