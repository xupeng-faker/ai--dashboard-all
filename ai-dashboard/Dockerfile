## 指定 Dockerfile 语法版本
# syntax=docker/dockerfile:1

## 构建阶段：使用 Node 20 Alpine 镜像
FROM node:20-alpine AS builder

## 支持代理构建参数
ARG http_proxy
ARG https_proxy
ARG HTTP_PROXY
ARG HTTPS_PROXY

## 设置代理环境变量，兼容大小写
ENV http_proxy=${http_proxy}
ENV https_proxy=${https_proxy}
ENV HTTP_PROXY=${HTTP_PROXY}
ENV HTTPS_PROXY=${HTTPS_PROXY}

## 工作目录
WORKDIR /app

## 只复制依赖声明以利用缓存
COPY package*.json ./

## 安装依赖
RUN npm ci

## 复制源代码
COPY . .

## 构建生产产物（包含类型检查）
RUN npm run build

## 运行阶段：使用精简的 Nginx 镜像
FROM nginx:1.27-alpine AS runtime

## 将构建产物复制到 Nginx 默认站点目录的 /ai_transform 子路径
COPY --from=builder /app/dist /usr/share/nginx/html/ai_transform

## 覆盖默认站点配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

## 暴露容器端口
EXPOSE 80

## 启动 Nginx 前台进程
CMD ["nginx", "-g", "daemon off;"]

