# Mock Server 启动脚本
Write-Host "正在启动 Mock Server..." -ForegroundColor Green

# 检查是否在正确的目录
if (-not (Test-Path "package.json")) {
    Write-Host "错误: 请在 mock-server 目录下运行此脚本" -ForegroundColor Red
    exit 1
}

# 检查并配置 npm 路径
$npmCmd = "npm"
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "正在查找 npm..." -ForegroundColor Yellow
    $nodePaths = @(
        "E:\Node。js",
        "C:\Program Files\nodejs",
        "C:\Program Files (x86)\nodejs"
    )
    
    $found = $false
    foreach ($path in $nodePaths) {
        $npmPath = Join-Path $path "npm.cmd"
        if (Test-Path $npmPath) {
            $env:Path = "$path;$env:Path"
            Write-Host "找到 npm: $npmPath" -ForegroundColor Green
            $found = $true
            break
        }
    }
    
    if (-not $found) {
        Write-Host "错误: 未找到 npm 命令！" -ForegroundColor Red
        Write-Host "请确保 Node.js 已安装，或将安装路径添加到 PATH 环境变量" -ForegroundColor Yellow
        exit 1
    }
}

# 检查依赖是否已安装
if (-not (Test-Path "node_modules")) {
    Write-Host "正在安装依赖..." -ForegroundColor Yellow
    & npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "依赖安装失败！" -ForegroundColor Red
        exit 1
    }
}

# 启动服务
Write-Host "启动 Mock Server (端口: 8080)..." -ForegroundColor Green
Write-Host "按 Ctrl+C 停止服务" -ForegroundColor Yellow
Write-Host ""

& npm run dev

