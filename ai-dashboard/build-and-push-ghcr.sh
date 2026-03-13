#!/bin/bash

# Docker 镜像构建和推送到 GitHub Container Registry 脚本
# 使用方法: ./build-and-push-ghcr.sh

set -e

# 从 git 获取仓库信息
GITHUB_REPO=$(git remote get-url origin 2>/dev/null | sed -E 's/.*github.com[:/]([^/]+\/[^/]+)(\.git)?/\1/' || echo "")
if [ -z "$GITHUB_REPO" ]; then
  echo "❌ 无法获取 GitHub 仓库信息，请确保在 git 仓库中运行此脚本"
  exit 1
fi

IMAGE_NAME="ai-dashboard"
VERSION="latest"
GHCR_IMAGE_NAME="ghcr.io/${GITHUB_REPO}/${IMAGE_NAME}:${VERSION}"

# 代理配置（如果需要）
PROXY=${PROXY:-"http://127.0.0.1:7890"}

echo "🚀 开始构建 Docker 镜像..."
echo "📦 目标镜像: ${GHCR_IMAGE_NAME}"

if [ -n "$PROXY" ]; then
  echo "📡 使用代理: $PROXY"
  docker build \
    --build-arg http_proxy=$PROXY \
    --build-arg https_proxy=$PROXY \
    --build-arg HTTP_PROXY=$PROXY \
    --build-arg HTTPS_PROXY=$PROXY \
    -t ${IMAGE_NAME}:${VERSION} .
else
  docker build -t ${IMAGE_NAME}:${VERSION} .
fi

echo "✅ 镜像构建完成"

echo "🏷️  为镜像打标签..."
docker tag ${IMAGE_NAME}:${VERSION} ${GHCR_IMAGE_NAME}

echo "🔐 请登录 GitHub Container Registry..."
echo "   使用 GitHub Personal Access Token (需要 packages:write 权限)"
docker login ghcr.io -u ${GITHUB_REPO%%/*}

echo "📤 推送镜像到 GitHub Container Registry..."
docker push ${GHCR_IMAGE_NAME}

echo "✅ 镜像已成功上传到 GitHub Container Registry!"
echo "📍 镜像地址: https://github.com/${GITHUB_REPO}/pkgs/container/${IMAGE_NAME}"
echo ""
echo "使用以下命令拉取镜像:"
echo "docker pull ${GHCR_IMAGE_NAME}"

