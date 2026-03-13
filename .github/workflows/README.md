# GitHub Actions 工作流说明

## Docker 镜像构建和推送

### 触发条件

工作流会在以下情况自动触发：

1. **推送到 main 分支** - 当代码推送到 main 分支时自动构建
2. **创建 Pull Request** - 在 PR 中构建镜像但不推送（用于测试）
3. **创建 Release** - 创建 GitHub Release 时构建并推送带版本标签的镜像
4. **手动触发** - 在 GitHub Actions 页面可以手动触发工作流

### 所需配置

在 GitHub 仓库中设置以下 Secrets：

1. 进入仓库 Settings → Secrets and variables → Actions
2. 添加以下 Secrets：

   - **DOCKERHUB_USERNAME**: 您的 Docker Hub 用户名（例如：`xupeng-faker`）
   - **DOCKERHUB_TOKEN**: Docker Hub 访问令牌

### 如何获取 Docker Hub Token

1. 登录 Docker Hub: https://hub.docker.com/
2. 点击右上角头像 → Account Settings
3. 选择 Security → New Access Token
4. 输入 Token 描述（例如：GitHub Actions）
5. 选择权限：Read & Write
6. 生成后复制 Token（只显示一次，请妥善保存）
7. 将 Token 添加到 GitHub Secrets 中

### 镜像标签说明

工作流会自动为镜像打上以下标签：

- `latest` - main 分支的最新版本
- `main` - main 分支构建
- `main-<sha>` - 包含 commit SHA 的标签
- `v1.0.0` - 如果创建了 Release，会使用版本号
- `1.0` - 主版本号.次版本号

### 使用镜像

构建完成后，可以通过以下方式使用镜像：

```bash
# 拉取最新版本
docker pull xupeng-faker/ai-dashboard:latest

# 拉取特定分支版本
docker pull xupeng-faker/ai-dashboard:main

# 运行容器
docker run -d -p 8080:80 xupeng-faker/ai-dashboard:latest
```

### 查看构建状态

1. 进入 GitHub 仓库
2. 点击 Actions 标签
3. 查看工作流运行状态和日志

