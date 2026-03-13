# Mock Server

可扩展的本地 Mock 服务，当前已实现部门筛选接口 `/ai_transform_webapi/department-info/children`，方便前端在未对接真实后端时调试。

## 功能特点

- 使用 TypeScript + Express，结构清晰易扩展
- 统一的响应结构，模拟后端 `Result` 返回格式
- 支持通过 `.env` 或环境变量 `MOCK_SERVER_PORT` 自定义端口
- 已内置健康检查接口 `/health`

## 快速开始

```bash
cd mock-server
npm install
npm run dev
```

默认端口为 `8080`（与前端 Vite 代理配置匹配），启动后可访问：

- `http://localhost:8080/health` 检查服务
- `http://localhost:8080/ai_transform_webapi/department-info/children?deptId=0` 获取三级部门

前端通过 Vite 代理自动将 `/ai_transform_webapi` 转发到 `http://localhost:8080`，无需额外配置。

## 目录结构

```
mock-server/
├── src/
│   ├── data/            # 模拟数据
│   │   └── department.ts
│   ├── routes/          # 路由定义
│   │   ├── department.ts
│   │   └── index.ts
│   ├── utils/           # 工具函数
│   │   └── response.ts
│   ├── types.ts         # 公共类型
│   └── server.ts        # 应用入口
├── package.json
├── tsconfig.json
└── README.md
```

## 扩展新接口

1. 在 `src/data` 中新增模拟数据或接入其他数据源
2. 在 `src/routes` 中创建新的路由文件，并在 `src/routes/index.ts` 中引入
3. 复用 `successResponse` / `errorResponse` 统一返回格式
4. 根据需要更新 README 说明

这样即可在 `npm run dev` 监听状态下实时热重载，快速迭代更多 mock API。
