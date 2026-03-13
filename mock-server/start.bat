@echo off
chcp 65001 >nul
echo ========================================
echo    Mock Server 启动脚本
echo ========================================
echo.

cd /d "%~dp0"

REM 尝试查找 npm
set "NPM_CMD=npm"
where npm >nul 2>&1
if errorlevel 1 (
    echo 正在查找 npm...
    REM 检查用户指定的安装位置
    if exist "E:\Node。js\npm.cmd" (
        set "NPM_CMD=E:\Node。js\npm.cmd"
        set "PATH=%PATH%;E:\Node。js"
        echo 找到 npm: %NPM_CMD%
    ) else if exist "C:\Program Files\nodejs\npm.cmd" (
        set "NPM_CMD=C:\Program Files\nodejs\npm.cmd"
        set "PATH=%PATH%;C:\Program Files\nodejs"
        echo 找到 npm: %NPM_CMD%
    ) else if exist "C:\Program Files (x86)\nodejs\npm.cmd" (
        set "NPM_CMD=C:\Program Files (x86)\nodejs\npm.cmd"
        set "PATH=%PATH%;C:\Program Files (x86)\nodejs"
        echo 找到 npm: %NPM_CMD%
    ) else (
        echo.
        echo [错误] 未找到 npm 命令！
        echo.
        echo 请确保已安装 Node.js:
        echo   1. 访问 https://nodejs.org/ 下载并安装 Node.js
        echo   2. 安装完成后，重新打开此窗口
        echo   3. 或者将 Node.js 安装目录添加到系统 PATH 环境变量
        echo.
        echo 如果已安装 Node.js，请手动将安装路径添加到 PATH 环境变量
        echo 例如: C:\Program Files\nodejs
        echo.
        pause
        exit /b 1
    )
)

echo.
echo 检查依赖...
if not exist "node_modules" (
    echo 正在安装依赖...
    call %NPM_CMD% install
    if errorlevel 1 (
        echo 依赖安装失败！
        pause
        exit /b 1
    )
)

echo.
echo 正在启动 Mock Server (端口: 8080)...
echo 按 Ctrl+C 停止服务
echo.

call %NPM_CMD% run dev

pause

