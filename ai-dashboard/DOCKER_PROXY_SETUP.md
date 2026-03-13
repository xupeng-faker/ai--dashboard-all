# Docker 代理配置说明

## 在 Docker Desktop 中配置代理

1. **打开 Docker Desktop**
2. **点击右上角的设置图标（齿轮）**
3. **进入 Resources → Proxies**
4. **配置代理设置：**
   - 勾选 "Manual proxy configuration"
   - Web Server (HTTP): `http://127.0.0.1:7890`
   - Secure Web Server (HTTPS): `http://127.0.0.1:7890`
   - 或者勾选 "Use system proxy"（如果系统已配置代理）
5. **点击 "Apply & Restart"**
6. **等待 Docker 重启完成**

## 验证代理配置

配置完成后，运行以下命令验证：

```bash
docker build -t ai-dashboard:latest .
```

## 如果仍然失败

如果配置后仍然无法连接，可以尝试：

1. **检查代理是否运行：**
   ```bash
   curl -x http://127.0.0.1:7890 https://www.google.com
   ```

2. **重启 Docker Desktop：**
   - 完全退出 Docker Desktop
   - 重新启动

3. **使用环境变量（临时方案）：**
   ```bash
   export http_proxy=http://127.0.0.1:7890
   export https_proxy=http://127.0.0.1:7890
   docker build --build-arg http_proxy=http://127.0.0.1:7890 --build-arg https_proxy=http://127.0.0.1:7890 -t ai-dashboard:latest .
   ```

