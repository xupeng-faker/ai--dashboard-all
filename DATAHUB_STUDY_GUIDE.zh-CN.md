## DataHub 系统性学习指南（基于 GitHub 仓库）

> 适用读者：准备基于 DataHub 做选型评估、二次开发或集成的后端 / 数据平台 / 前端工程师。
> 参考仓库：[datahub-project/datahub](https://github.com/datahub-project/datahub)

---

## 1. 文档目标与阅读建议

- **文档目标**
  - 帮助读者在不完整阅读源码的情况下，系统性理解 DataHub 的整体架构与关键模块。
  - 梳理 DataHub GitHub 仓库结构，说明每个主要目录的职责与相互关系。
  - 形成一条“从上手到二次开发”的学习路径，方便团队内部培训与知识沉淀。

- **阅读顺序建议**
  - 第 1 阶段：阅读本指南第 2、3 章，获得整体认知与架构视图。
  - 第 2 阶段：根据角色重点阅读第 4～6 章（后端、ingestion、GraphQL & 前端）。
  - 第 3 阶段：有部署/运维需求时，阅读第 7 章；需要做扩展/二开时，重点阅读第 8 章。
  - 第 4 阶段：结合第 9 章学习路径与官方文档进行实践演练。

---

## 2. 仓库结构与模块职责总览（Overview）

> 本章从宏观角度介绍 DataHub 仓库中最重要的目录与模块，不展开实现细节，帮助你建立"心智地图"。

### 2.1 核心模块目录

根据 [datahub-project/datahub](https://github.com/datahub-project/datahub) 仓库结构，主要模块如下：

| 目录/模块 | 技术栈 | 主要职责 |
|---------|--------|---------|
| **`datahub-web-react`** | React + TypeScript | 现代 Web UI，提供搜索、实体详情、血缘视图、Glossary 管理等前端功能 |
| **`datahub-frontend`** | Java + Mustache | 早期前端/服务端渲染层，部分部署模式下仍在使用 |
| **`datahub-graphql-core`** | Java + GraphQL | GraphQL API 层，定义 Schema 并处理前端查询请求，调用后端服务 |
| **`entity-registry`** | YAML/Avro/PDL | 元数据模型定义，定义所有实体类型（Dataset、Dashboard、MLModel 等）的 Schema |
| **`metadata-service`** (或 `metadata-*`) | Java + Spring | GMS（Generalized Metadata Service）核心服务，负责元数据的 CRUD、版本控制、搜索索引 |
| **`ingestion-scheduler`** | Java | 元数据采集任务调度服务，管理定时 ingestion 作业 |
| **`metadata-ingestion`** (Python 包) | Python | 元数据采集框架，提供 Source/Sink/Transform 插件体系，支持多种数据源连接器 |
| **`datahub-actions`** | Python/Java | 事件驱动框架，响应元数据变更并触发自动化动作（通知、标签、策略等） |
| **`datahub-kubernetes`** | Kubernetes + Helm | Kubernetes 部署配置与 Helm Charts |
| **`docker`** | Docker Compose | 本地快速体验的 Docker Compose 配置 |
| **`docs` / `docs-website`** | Markdown/Docusaurus | 官方文档源文件，对应 `docs.datahub.com` |
| **`contrib`** | 混合 | 社区贡献的实验性功能与扩展 |

### 2.2 模块间关系示意

```
┌─────────────────────────────────────────────────────────────┐
│                    数据源（上游系统）                          │
│  (MySQL, Snowflake, Kafka, Airflow, Looker, dbt, etc.)      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ ingestion (Python)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              metadata-ingestion (Python 框架)                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │  Source  │→ │Transform │→ │   Sink   │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Kafka / REST API
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              metadata-service (GMS) - Java                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  RDBMS       │  │ Elasticsearch│  │    Kafka      │     │
│  │  (持久化)     │  │  (搜索索引)   │  │  (事件流)     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ GraphQL / REST
                       ▼
┌─────────────────────────────────────────────────────────────┐
│         datahub-graphql-core (GraphQL API 层)                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Query: search, entity, lineage, glossary, etc.      │   │
│  │  Mutation: updateEntity, addTag, addOwner, etc.      │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ GraphQL Query/Mutation
                       ▼
┌─────────────────────────────────────────────────────────────┐
│         datahub-web-react (React + TypeScript)                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  搜索页       │  │  实体详情页   │  │  血缘视图     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 关键目录说明

- **`entity-registry`**：元数据模型的"源头"，所有实体类型（Dataset、SchemaField、Dashboard、User、Tag 等）的定义都在这里。修改这里会影响整个系统的元数据 Schema。
- **`metadata-service`**：后端核心，负责元数据的持久化、查询、搜索、版本管理。与 RDBMS、Elasticsearch、Kafka 交互。
- **`metadata-ingestion`**：Python 包，提供统一的配置驱动式采集框架。内置 50+ 种 Source 插件（数据库、数据仓库、BI 工具、ML 平台等）。
- **`datahub-graphql-core`**：前端与后端之间的 API 网关，将前端的 GraphQL 请求转换为对 GMS 的调用。
- **`datahub-web-react`**：现代前端应用，使用 React + TypeScript，通过 GraphQL 与后端交互。

### 2.4 构建系统

- **Java 模块**：使用 Gradle 构建（`build.gradle`、`settings.gradle`），支持多模块项目。
- **Python 模块**：使用 `setup.py` 或 `pyproject.toml`，通过 PyPI 发布为 `acryl-datahub` 包。
- **前端模块**：使用 npm/yarn 管理依赖，构建工具可能是 Webpack 或 Vite。

---

## 3. 整体系统架构与数据流

> 站在"元数据平台"的视角，描述 DataHub 各组件在实际部署中的角色与数据流向。

### 3.1 系统架构概览

DataHub 采用**微服务架构**，核心组件包括：

1. **元数据服务层（GMS）**：Java 服务，负责元数据的存储、查询、版本控制
2. **搜索服务**：基于 Elasticsearch，提供全文搜索与过滤能力
3. **消息队列**：Kafka，用于元数据变更事件的异步处理
4. **持久化存储**：关系型数据库（如 MySQL/PostgreSQL），存储元数据的结构化信息
5. **GraphQL API 层**：Java 服务，作为前端与后端的统一接口
6. **Web 前端**：React 应用，提供用户交互界面
7. **Ingestion 框架**：Python 工具，从上游系统采集元数据

### 3.2 元数据生命周期与数据流

#### 3.2.1 元数据采集流程（Ingestion）

```
上游数据源
    │
    │ 1. 配置 YAML 文件，定义 Source（如 MySQL、Snowflake）
    ▼
metadata-ingestion (Python CLI)
    │
    │ 2. 连接数据源，读取 Schema、血缘、Owner 等信息
    │    执行 Transform（字段映射、过滤等）
    ▼
    ┌─────────────────────────────────────┐
    │  生成统一格式的元数据事件 (MCE/MCP)  │
    │  - MetadataChangeEvent (MCE)        │
    │  - MetadataChangeProposal (MCP)    │
    └─────────────────────────────────────┘
    │
    │ 3. 通过 Kafka 或 REST API 发送到 GMS
    ▼
metadata-service (GMS)
    │
    │ 4. 验证 Schema、版本控制、持久化
    ├──→ RDBMS (持久化存储)
    ├──→ Elasticsearch (索引可搜索字段)
    └──→ Kafka (发布变更事件)
```

**关键概念**：
- **MCE (MetadataChangeEvent)**：完整的元数据变更事件，包含实体的全量信息
- **MCP (MetadataChangeProposal)**：部分元数据变更提案，用于增量更新
- **Source**：数据源连接器（如 `mysql`、`snowflake`、`kafka`）
- **Sink**：目标输出（默认是 DataHub，也可以是文件或其他系统）
- **Transform**：元数据转换插件，用于字段映射、过滤、增强等

#### 3.2.2 元数据查询流程（Query）

```
用户在前端搜索/浏览
    │
    │ 1. 用户在 datahub-web-react 中搜索 "user_table"
    ▼
datahub-web-react
    │
    │ 2. 构造 GraphQL Query: search(query: "user_table", ...)
    ▼
datahub-graphql-core
    │
    │ 3. 解析 GraphQL，调用对应的 Resolver
    ├──→ 搜索请求 → Elasticsearch (全文搜索)
    ├──→ 实体详情 → metadata-service → RDBMS
    └──→ 血缘关系 → metadata-service → RDBMS (图查询)
    │
    │ 4. 聚合结果，返回 GraphQL Response
    ▼
datahub-web-react
    │
    │ 5. 渲染搜索结果/实体详情页
    ▼
用户看到结果
```

#### 3.2.3 元数据变更流程（Mutation）

```
用户在 UI 上添加标签/Owner
    │
    │ 1. 用户点击 "Add Tag" 按钮
    ▼
datahub-web-react
    │
    │ 2. 构造 GraphQL Mutation: addTag(input: {...})
    ▼
datahub-graphql-core
    │
    │ 3. 权限校验、调用 metadata-service
    ▼
metadata-service (GMS)
    │
    │ 4. 更新 RDBMS、Elasticsearch
    │    发布变更事件到 Kafka
    ├──→ RDBMS (更新实体记录)
    ├──→ Elasticsearch (更新索引)
    └──→ Kafka (发布 MCE 事件)
    │
    │ 5. 返回更新结果
    ▼
datahub-web-react
    │
    │ 6. UI 刷新，显示新标签
    ▼
用户看到更新
```

**事件驱动扩展**：
- Kafka 中的元数据变更事件可以被 `datahub-actions` 消费
- Actions 可以触发自动化流程：发送通知、自动添加标签、创建工单等

### 3.3 核心存储组件

| 组件 | 用途 | 存储内容 |
|-----|------|---------|
| **RDBMS** (MySQL/PostgreSQL) | 持久化存储 | 实体的结构化元数据（Dataset、Schema、Owner、Tag、Glossary 等） |
| **Elasticsearch** | 搜索索引 | 可搜索字段的全文索引（名称、描述、标签等），支持模糊搜索与过滤 |
| **Kafka** | 事件流 | 元数据变更事件（MCE/MCP），供 Actions 和其他下游系统消费 |

### 3.4 部署架构示意

**本地开发环境（Docker Compose）**：
```
┌─────────────────────────────────────────┐
│  Docker Compose Stack                   │
│  ┌─────────────┐  ┌─────────────┐     │
│  │  GMS        │  │  GraphQL    │     │
│  │  (Java)     │  │  (Java)     │     │
│  └─────────────┘  └─────────────┘     │
│  ┌─────────────┐  ┌─────────────┐     │
│  │  MySQL      │  │ Elasticsearch│    │
│  └─────────────┘  └─────────────┘     │
│  ┌─────────────┐  ┌─────────────┐     │
│  │  Kafka      │  │  Zookeeper  │     │
│  └─────────────┘  └─────────────┘     │
│  ┌─────────────┐                       │
│  │  Frontend   │                       │
│  │  (React)    │                       │
│  └─────────────┘                       │
└─────────────────────────────────────────┘
```

**生产环境（Kubernetes）**：
- 各组件以独立的 Deployment/StatefulSet 运行
- 使用 Helm Charts 管理配置与依赖
- 支持水平扩展（GMS、GraphQL、Elasticsearch 等）
- 可配置外部存储（RDS、Elasticsearch 集群、Kafka 集群）

---

## 4. 元数据模型与 GMS（Generalized Metadata Service）

> 聚焦后端核心：实体模型（entity-registry）与元数据服务（GMS）。

### 4.1 元数据模型（Entity Registry）

DataHub 的元数据模型定义在 `entity-registry` 目录中，使用 **PDL (Pegasus Data Language)** 或 **YAML** 格式定义。

#### 4.1.1 核心实体类型

DataHub 支持多种实体类型，常见的有：

| 实体类型 | 用途 | 示例 |
|---------|------|------|
| **Dataset** | 数据集（表、视图等） | MySQL 表、Snowflake 表、Kafka Topic |
| **SchemaField** | 字段/列 | 表中的列、JSON 字段 |
| **Dashboard** | 仪表板 | Looker Dashboard、Tableau Dashboard |
| **Chart** | 图表 | Looker Chart、Tableau Chart |
| **DataFlow** | 数据流/管道 | Airflow DAG、dbt Project |
| **DataJob** | 数据作业 | Airflow Task、dbt Model |
| **MLModel** | 机器学习模型 | MLflow Model、SageMaker Model |
| **User** | 用户 | 系统用户 |
| **Group** | 用户组 | 部门、团队 |
| **Tag** | 标签 | 分类标签（如 "PII"、"Sensitive"） |
| **GlossaryTerm** | 业务术语 | 业务词汇表中的术语 |
| **Domain** | 数据域 | 数据治理中的域划分 |

#### 4.1.2 实体结构示例（Dataset）

一个典型的 Dataset 实体包含以下信息：

```yaml
# 实体标识
urn: urn:li:dataset:(urn:li:dataPlatform:mysql,db.table,PROD)
type: dataset

# 基本信息
name: "user_table"
description: "用户信息表"

# 平台信息
platform: mysql
platformInstance: production

# Schema（字段定义）
schema:
  fields:
    - fieldPath: "user_id"
      type: NUMBER
      description: "用户ID"
    - fieldPath: "user_name"
      type: STRING
      description: "用户名"

# 所有者
ownership:
  owners:
    - owner: "urn:li:corpuser:alice"
      type: DATAOWNER

# 标签
tags:
  - tag: "urn:li:tag:PII"

# 血缘关系
upstreamLineage:
  upstreams:
    - dataset: "urn:li:dataset:(mysql,source_table,PROD)"
      type: TRANSFORMED
```

#### 4.1.3 实体扩展方式

如果需要新增实体类型或扩展现有实体：

1. **在 `entity-registry` 中定义新的实体 Schema**
   - 使用 PDL 或 YAML 定义实体结构
   - 运行代码生成工具，生成对应的 Java/Python 类

2. **更新元数据服务**
   - 在 `metadata-service` 中添加新实体的 CRUD 逻辑
   - 更新搜索索引配置（Elasticsearch mapping）

3. **更新前端**
   - 在 `datahub-web-react` 中添加新实体的展示组件
   - 更新 GraphQL Schema 以支持新实体的查询

### 4.2 GMS（Generalized Metadata Service）

GMS 是 DataHub 的后端核心服务，负责元数据的**存储、查询、版本控制、搜索索引**。

#### 4.2.1 GMS 核心功能

| 功能 | 说明 |
|-----|------|
| **元数据 CRUD** | 创建、读取、更新、删除元数据实体 |
| **版本控制** | 记录元数据的变更历史，支持回滚 |
| **搜索索引** | 将元数据索引到 Elasticsearch，支持全文搜索 |
| **血缘管理** | 维护实体之间的上下游关系（图结构） |
| **权限控制** | 基于 Policy 的访问控制（Policies） |
| **审计日志** | 记录元数据变更的操作日志 |

#### 4.2.2 元数据写入流程

```
1. 接收元数据事件（MCE/MCP）
   ↓
2. Schema 验证
   - 检查实体类型是否合法
   - 验证字段是否符合 Schema 定义
   ↓
3. 版本控制
   - 生成新的版本号
   - 保存历史版本（可选）
   ↓
4. 持久化
   - 写入 RDBMS（结构化数据）
   - 更新 Elasticsearch（搜索索引）
   ↓
5. 发布事件
   - 发送 MCE 到 Kafka，供下游系统消费
   ↓
6. 返回结果
```

#### 4.2.3 元数据查询流程

GMS 支持多种查询方式：

- **按 URN 查询**：直接通过实体 URN 获取完整实体信息
- **搜索查询**：通过 Elasticsearch 进行全文搜索与过滤
- **血缘查询**：基于图结构查询实体的上游/下游关系
- **批量查询**：通过 URN 列表批量获取实体信息

#### 4.2.4 GMS API 接口

GMS 提供 REST API 和内部 RPC 接口：

- **REST API**：`/entities/v2/{entityType}/{entityUrn}` 等
- **内部 RPC**：Java 服务间调用，GraphQL 层通过 RPC 调用 GMS

### 4.3 元数据存储架构

#### 4.3.1 RDBMS 存储

关系型数据库存储实体的**结构化元数据**：

- **实体表**：存储实体的基本信息（URN、类型、创建时间等）
- **Aspect 表**：存储实体的各个 Aspect（如 `ownership`、`schemaMetadata`、`tags` 等）
- **关系表**：存储实体之间的关联关系（血缘、依赖等）

**Aspect 模式**：
- DataHub 使用 **Aspect 模式**存储元数据
- 每个实体由多个 Aspect 组成（如 `ownership`、`schemaMetadata`、`institutionalMemory` 等）
- 这种设计支持**部分更新**，只需更新相关的 Aspect，而不需要替换整个实体

#### 4.3.2 Elasticsearch 索引

Elasticsearch 存储**可搜索字段**的全文索引：

- **实体名称**：支持模糊搜索
- **描述信息**：支持全文检索
- **标签、术语**：支持按标签/术语过滤
- **字段名、字段描述**：支持字段级别的搜索

**索引更新策略**：
- 元数据变更时，同步更新 Elasticsearch 索引
- 支持增量更新，只更新变更的字段

#### 4.3.3 Kafka 事件流

Kafka 用于**事件驱动架构**：

- **MCE Topic**：存储完整的元数据变更事件
- **MCP Topic**：存储部分元数据变更提案
- **下游消费**：`datahub-actions`、外部系统可以消费这些事件

### 4.4 元数据版本控制

DataHub 支持元数据的**版本控制**：

- **版本号**：每次更新都会生成新的版本号
- **历史记录**：可以查询实体的历史版本（如果启用）
- **回滚**：支持回滚到历史版本（需要配置）

**版本控制策略**：
- 默认情况下，只保留最新版本
- 可以通过配置启用历史版本存储（需要额外的存储空间）

---

## 5. Ingestion（元数据采集）框架与调度

> 说明 DataHub 如何从各类上游系统采集元数据，以及如何调度定时作业。

### 5.1 Ingestion 框架概述

DataHub 的元数据采集框架是一个 **Python 包**（`acryl-datahub`），提供统一的配置驱动式采集能力。

**核心特点**：
- **插件化架构**：支持多种数据源连接器（Source）
- **配置驱动**：通过 YAML 配置文件定义采集任务
- **可扩展**：支持自定义 Source、Transform、Sink
- **灵活部署**：可以 CLI 运行、Airflow DAG、Kubernetes Job 等方式执行

### 5.2 核心概念

#### 5.2.1 Source（数据源）

Source 是数据源连接器，负责从上游系统读取元数据。DataHub 内置了 50+ 种 Source，包括：

| 类别 | Source 示例 |
|-----|-----------|
| **关系型数据库** | `mysql`、`postgres`、`mssql`、`oracle` |
| **数据仓库** | `snowflake`、`bigquery`、`redshift`、`databricks` |
| **NoSQL** | `mongodb`、`cassandra` |
| **消息队列** | `kafka`、`pulsar` |
| **数据湖** | `s3`、`hive`、`delta-lake` |
| **BI 工具** | `looker`、`tableau`、`powerbi`、`metabase` |
| **数据管道** | `airflow`、`dagster`、`prefect` |
| **ML 平台** | `mlflow`、`sagemaker` |
| **数据建模** | `dbt` |
| **文件系统** | `csv`、`json`、`avro` |

#### 5.2.2 Transform（转换）

Transform 用于在采集过程中对元数据进行转换、过滤、增强：

- **字段映射**：重命名字段、添加前缀/后缀
- **过滤**：根据条件过滤实体或字段
- **增强**：添加默认标签、Owner、描述等
- **标准化**：统一命名规范、数据类型等

#### 5.2.3 Sink（输出）

Sink 定义元数据的输出目标：

- **datahub-rest**：通过 REST API 发送到 DataHub（默认）
- **datahub-kafka**：发送到 Kafka，由 DataHub 消费
- **file**：输出到本地文件（用于调试或备份）

### 5.3 配置文件示例

#### 5.3.1 MySQL Source 配置

```yaml
# mysql_ingestion.yaml
source:
  type: mysql
  config:
    # 数据库连接配置
    host_port: "localhost:3306"
    database: "mydb"
    username: "user"
    password: "password"
    
    # 采集选项
    include_tables: true
    include_views: true
    include_procedures: false
    
    # 表过滤（可选）
    table_pattern:
      allow:
        - "^public\\.users$"
        - "^public\\.orders$"
    
    # 环境标签
    env: "PROD"

# Transform（可选）
transformers:
  - type: "add_dataset_ownership"
    config:
      owner_urns:
        - "urn:li:corpuser:alice"
        - "urn:li:corpGroup:data-team"

# Sink（输出到 DataHub）
sink:
  type: "datahub-rest"
  config:
    server: "http://localhost:8080"
    token: "${DATAHUB_TOKEN}"  # 从环境变量读取
```

#### 5.3.2 Snowflake Source 配置

```yaml
# snowflake_ingestion.yaml
source:
  type: snowflake
  config:
    account_id: "myaccount"
    username: "user"
    password: "password"
    warehouse: "COMPUTE_WH"
    role: "ACCOUNTADMIN"
    
    # 数据库/模式过滤
    database_pattern:
      allow:
        - "^ANALYTICS$"
    schema_pattern:
      allow:
        - "^PUBLIC$"
    
    # 表过滤
    table_pattern:
      deny:
        - ".*_TEMP$"
    
    env: "PROD"

sink:
  type: "datahub-rest"
  config:
    server: "http://datahub.example.com:8080"
```

### 5.4 运行 Ingestion

#### 5.4.1 安装 DataHub CLI

```bash
# 安装 Python 包
python3 -m pip install --upgrade pip wheel setuptools
python3 -m pip install --upgrade acryl-datahub

# 验证安装
datahub version
```

#### 5.4.2 运行 Ingestion 任务

```bash
# 使用配置文件运行
datahub ingest -c mysql_ingestion.yaml

# 预览模式（不实际发送数据）
datahub ingest -c mysql_ingestion.yaml --dry-run

# 查看帮助
datahub ingest --help
```

#### 5.4.3 验证采集结果

```bash
# 检查实体是否已创建
datahub get --urn "urn:li:dataset:(urn:li:dataPlatform:mysql,mydb.users,PROD)"

# 搜索实体
datahub search --query "users" --type "dataset"
```

### 5.5 Ingestion Scheduler（调度服务）

`ingestion-scheduler` 是 DataHub 的 Java 服务，用于**管理和调度定时 ingestion 任务**。

#### 5.5.1 功能特性

- **任务管理**：创建、更新、删除 ingestion 任务
- **定时调度**：基于 Cron 表达式调度任务
- **执行监控**：跟踪任务执行状态、日志、错误
- **重试机制**：任务失败时自动重试
- **与 Actions 集成**：任务执行完成后可以触发 Actions

#### 5.5.2 任务配置示例

```yaml
# ingestion_schedule.yaml
name: "mysql-daily-ingestion"
source:
  type: mysql
  config:
    host_port: "mysql-server:3306"
    database: "mydb"
    # ... 其他配置

sink:
  type: "datahub-rest"
  config:
    server: "http://datahub:8080"

# 调度配置
schedule:
  interval: "0 2 * * *"  # 每天凌晨 2 点执行
  timezone: "UTC"
```

#### 5.5.3 通过 UI 管理任务

- 在 DataHub UI 中，可以创建和管理 ingestion 任务
- 支持查看任务执行历史、日志、错误信息
- 支持手动触发任务执行

### 5.6 高级用法

#### 5.6.1 自定义 Source

如果需要支持新的数据源，可以开发自定义 Source：

```python
# custom_source.py
from datahub.ingestion.api.source import Source, SourceReport
from datahub.ingestion.api.common import WorkUnit

class CustomSource(Source):
    def __init__(self, config):
        self.config = config
    
    def get_workunits(self):
        # 实现元数据采集逻辑
        # 返回 WorkUnit 列表
        pass
    
    def get_report(self) -> SourceReport:
        # 返回采集报告
        pass
```

然后在配置文件中使用：

```yaml
source:
  type: "module_path.custom_source.CustomSource"
  config:
    # 自定义配置
```

#### 5.6.2 使用 Transform 增强元数据

```yaml
transformers:
  # 添加默认标签
  - type: "add_dataset_tags"
    config:
      tags:
        - "urn:li:tag:production"
  
  # 添加 Owner
  - type: "add_dataset_ownership"
    config:
      owner_urns:
        - "urn:li:corpuser:data-owner"
  
  # 字段级别的转换
  - type: "pattern"
    config:
      rules:
        - match: ".*_id$"
          transform: "uppercase"
```

#### 5.6.3 血缘关系采集

某些 Source（如 `dbt`、`airflow`）可以自动采集血缘关系：

```yaml
source:
  type: dbt
  config:
    manifest_path: "/path/to/manifest.json"
    catalog_path: "/path/to/catalog.json"
    # dbt 会自动解析模型之间的依赖关系
```

### 5.7 最佳实践

1. **环境隔离**：为不同环境（DEV、STAGING、PROD）使用不同的配置文件
2. **增量采集**：对于大型数据源，使用增量采集策略，只采集变更的部分
3. **错误处理**：配置适当的重试机制和错误通知
4. **性能优化**：对于大量表，考虑并行采集或分批处理
5. **安全配置**：使用环境变量或密钥管理服务存储敏感信息（密码、Token 等）

---

## 6. GraphQL API 与 Web 前端（React + TypeScript）

> 描述前端如何通过 GraphQL 使用 DataHub 的元数据能力，并分析主要页面结构。

### 6.1 GraphQL API 层（datahub-graphql-core）

`datahub-graphql-core` 是 DataHub 的 GraphQL API 层，作为前端与后端服务之间的**统一接口**。

#### 6.1.1 GraphQL Schema 概览

DataHub 的 GraphQL Schema 定义了前端可以使用的所有查询和变更操作：

**主要 Query 类型**：
- `search`：全局搜索（支持按实体类型、标签、Owner 等过滤）
- `entity`：获取单个实体的详细信息
- `lineage`：获取实体的血缘关系（上游/下游）
- `glossaryTerms`：获取业务术语列表
- `listTags`：获取标签列表
- `listDomains`：获取数据域列表
- `searchAcrossEntities`：跨实体类型搜索

**主要 Mutation 类型**：
- `updateDataset`：更新数据集元数据
- `addTag`：为实体添加标签
- `removeTag`：移除实体标签
- `addOwner`：添加 Owner
- `removeOwner`：移除 Owner
- `updateDescription`：更新描述
- `addTerm`：添加业务术语关联

#### 6.1.2 GraphQL Query 示例

**搜索查询**：
```graphql
query SearchDatasets($input: SearchInput!) {
  search(input: $input) {
    searchResults {
      entity {
        urn
        type
        ... on Dataset {
          name
          platform {
            name
          }
          description
          tags {
            tags {
              tag {
                name
              }
            }
          }
          ownership {
            owners {
              owner {
                ... on CorpUser {
                  username
                }
              }
            }
          }
        }
      }
    }
    facets {
      field
      aggregations {
        value
        count
      }
    }
  }
}
```

**实体详情查询**：
```graphql
query GetDataset($urn: String!) {
  dataset(urn: $urn) {
    urn
    name
    description
    platform {
      name
    }
    schema {
      fields {
        fieldPath
        type
        description
        tags {
          tags {
            tag {
              name
            }
          }
        }
      }
    }
    ownership {
      owners {
        owner {
          ... on CorpUser {
            username
            displayName
          }
        }
        type
      }
    }
    tags {
      tags {
        tag {
          name
        }
      }
    }
    upstreamLineage {
      upstreams {
        dataset {
          urn
          name
        }
        type
      }
    }
    downstreamLineage {
      downstreams {
        dataset {
          urn
          name
        }
        type
      }
    }
  }
}
```

**血缘查询**：
```graphql
query GetLineage($urn: String!, $direction: LineageDirection!) {
  lineage(input: { urn: $urn, direction: $direction, depth: 3 }) {
    entities {
      urn
      type
      ... on Dataset {
        name
        platform {
          name
        }
      }
    }
    relationships {
      type
      upstream {
        urn
      }
      downstream {
        urn
      }
    }
  }
}
```

#### 6.1.3 GraphQL Mutation 示例

**添加标签**：
```graphql
mutation AddTag($input: TagAssociationInput!) {
  addTag(input: $input)
}
```

**变量**：
```json
{
  "input": {
    "tagUrn": "urn:li:tag:PII",
    "resourceUrn": "urn:li:dataset:(mysql,mydb.users,PROD)"
  }
}
```

**更新描述**：
```graphql
mutation UpdateDescription($input: DescriptionUpdateInput!) {
  updateDescription(input: $input)
}
```

#### 6.1.4 GraphQL Resolver 实现

GraphQL Resolver 负责将前端的查询/变更请求转换为对后端服务的调用：

```java
// 伪代码示例
@GraphQLResolver
public class DatasetResolver {
    
    @Autowired
    private EntityService entityService;
    
    @Autowired
    private SearchService searchService;
    
    public Dataset dataset(String urn) {
        // 调用 GMS 获取实体详情
        return entityService.getEntity(urn);
    }
    
    public SearchResults search(SearchInput input) {
        // 调用 Elasticsearch 进行搜索
        return searchService.search(input);
    }
}
```

### 6.2 Web 前端（datahub-web-react）

`datahub-web-react` 是 DataHub 的现代 Web 前端，使用 **React + TypeScript** 构建。

#### 6.2.1 前端技术栈

- **框架**：React 18+
- **语言**：TypeScript
- **状态管理**：React Context / Redux（根据版本）
- **GraphQL 客户端**：Apollo Client 或类似库
- **路由**：React Router
- **UI 组件库**：Ant Design 或自定义组件
- **构建工具**：Webpack 或 Vite

#### 6.2.2 目录结构

```
datahub-web-react/
├── src/
│   ├── app/                    # 应用入口
│   ├── pages/                  # 页面组件
│   │   ├── search/            # 搜索页
│   │   ├── entity/            # 实体详情页
│   │   │   ├── dataset/      # Dataset 详情页
│   │   │   ├── dashboard/    # Dashboard 详情页
│   │   │   └── ...
│   │   ├── lineage/           # 血缘视图
│   │   ├── glossary/          # Glossary 管理
│   │   └── settings/          # 设置页
│   ├── components/            # 可复用组件
│   │   ├── search/           # 搜索相关组件
│   │   ├── entity/           # 实体展示组件
│   │   ├── lineage/          # 血缘可视化组件
│   │   └── common/           # 通用组件
│   ├── graphql/              # GraphQL 查询定义
│   │   ├── queries/          # Query 定义
│   │   └── mutations/        # Mutation 定义
│   ├── routes/               # 路由配置
│   ├── utils/                # 工具函数
│   └── styles/               # 样式文件
```

#### 6.2.3 核心页面功能

**1. 搜索页（Search Page）**

- **功能**：全局搜索、按类型过滤、按标签/Owner 过滤、分页
- **GraphQL Query**：使用 `search` 或 `searchAcrossEntities`
- **关键组件**：
  - 搜索框（支持自动补全）
  - 过滤器侧边栏（标签、Owner、平台等）
  - 结果列表（实体卡片）
  - 分页组件

**2. 实体详情页（Entity Detail Page）**

- **功能**：展示实体的完整信息、编辑元数据、查看血缘
- **GraphQL Query**：使用 `entity` 查询获取实体详情
- **关键组件**：
  - 实体头部（名称、描述、标签、Owner）
  - Schema 展示（对于 Dataset）
  - 血缘视图（上游/下游）
  - 操作按钮（添加标签、编辑描述等）

**3. 血缘视图（Lineage View）**

- **功能**：可视化展示实体的血缘关系（图结构）
- **GraphQL Query**：使用 `lineage` 查询
- **关键组件**：
  - 图可视化组件（使用 D3.js 或类似库）
  - 节点（实体）和边（关系）
  - 交互功能（缩放、拖拽、点击查看详情）

**4. Glossary 管理页**

- **功能**：管理业务术语、关联实体
- **GraphQL Query/Mutation**：
  - `glossaryTerms`：获取术语列表
  - `addTerm`：关联术语到实体
  - `removeTerm`：移除术语关联

#### 6.2.4 前端到 GraphQL 的调用链

```
用户操作（点击搜索按钮）
    ↓
React 组件（SearchPage.tsx）
    ↓
调用 GraphQL Hook（useSearchQuery）
    ↓
Apollo Client 发送 GraphQL 请求
    ↓
datahub-graphql-core（GraphQL API 层）
    ↓
解析 GraphQL，调用 Resolver
    ↓
Resolver 调用后端服务（GMS、SearchService）
    ↓
返回数据
    ↓
Apollo Client 更新缓存
    ↓
React 组件重新渲染，显示结果
```

#### 6.2.5 状态管理

前端使用 **Apollo Client** 管理 GraphQL 查询的状态：

- **缓存**：Apollo Client 自动缓存查询结果
- **更新**：Mutation 执行后，自动更新相关查询的缓存
- **乐观更新**：支持乐观更新，提升用户体验

### 6.3 前端开发指南

#### 6.3.1 本地开发

```bash
# 进入前端目录
cd datahub-web-react

# 安装依赖
npm install
# 或
yarn install

# 启动开发服务器
npm start
# 或
yarn start

# 构建生产版本
npm run build
```

#### 6.3.2 添加新页面

1. **创建页面组件**：
```typescript
// src/pages/custom/CustomPage.tsx
import React from 'react';

export const CustomPage: React.FC = () => {
  return <div>Custom Page</div>;
};
```

2. **添加路由**：
```typescript
// src/routes/index.tsx
import { CustomPage } from '../pages/custom/CustomPage';

// 在路由配置中添加
{
  path: '/custom',
  component: CustomPage,
}
```

3. **添加 GraphQL 查询**（如需要）：
```typescript
// src/graphql/queries/customQuery.ts
import { gql } from '@apollo/client';

export const CUSTOM_QUERY = gql`
  query CustomQuery($input: CustomInput!) {
    custom(input: $input) {
      # ...
    }
  }
`;
```

#### 6.3.3 自定义实体详情页

如果需要为新的实体类型添加详情页：

1. **创建实体组件**：
```typescript
// src/pages/entity/customEntity/CustomEntityPage.tsx
import React from 'react';
import { useGetEntityQuery } from '../../../graphql/queries';

export const CustomEntityPage: React.FC<{ urn: string }> = ({ urn }) => {
  const { data, loading } = useGetEntityQuery({ variables: { urn } });
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      <h1>{data?.entity?.name}</h1>
      {/* 渲染实体详情 */}
    </div>
  );
};
```

2. **在路由中注册**：
```typescript
// 根据实体类型路由到对应的详情页
{
  path: '/entity/:type/:urn',
  component: EntityRouter, // 根据 type 路由到对应的页面
}
```

### 6.4 前端最佳实践

1. **GraphQL 查询优化**：
   - 使用字段选择，只查询需要的字段
   - 使用分页，避免一次性加载大量数据
   - 使用缓存，减少重复查询

2. **组件设计**：
   - 保持组件小而专注
   - 使用 TypeScript 类型定义，确保类型安全
   - 复用通用组件（如实体卡片、标签组件等）

3. **性能优化**：
   - 使用 React.memo 避免不必要的重渲染
   - 使用虚拟滚动处理长列表
   - 懒加载非关键组件

4. **错误处理**：
   - 使用 GraphQL 错误处理机制
   - 提供友好的错误提示
   - 实现重试机制

---

## 7. 部署架构与运维要点

> 概述本地 Docker 快速体验与生产环境（Kubernetes + Helm）部署要点。

### 7.1 本地快速体验（Docker Compose）

DataHub 提供了 Docker Compose 配置，可以快速在本地启动一个完整的 DataHub 实例。

#### 7.1.1 使用 DataHub CLI 启动

**最简单的方式**：

```bash
# 安装 DataHub CLI
python3 -m pip install --upgrade acryl-datahub

# 启动 DataHub（会自动下载并启动所有组件）
datahub docker quickstart

# 启动后访问
# http://localhost:9002
# 默认用户名/密码：datahub / datahub
```

**启动的组件**：
- GMS（元数据服务）
- GraphQL API
- Web 前端
- MySQL（持久化存储）
- Elasticsearch（搜索索引）
- Kafka + Zookeeper（消息队列）
- Schema Registry

#### 7.1.2 手动使用 Docker Compose

如果需要自定义配置：

```bash
# 克隆仓库
git clone https://github.com/datahub-project/datahub.git
cd datahub

# 进入 docker 目录
cd docker

# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

#### 7.1.3 验证部署

```bash
# 检查服务状态
docker-compose ps

# 检查 GMS 健康状态
curl http://localhost:8080/health

# 检查 GraphQL 端点
curl -X POST http://localhost:9002/api/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ search(input: {query: \"*\", start: 0, count: 10}) { searchResults { entity { urn } } } }"}'
```

#### 7.1.4 摄取示例数据

```bash
# 摄取示例数据
datahub docker ingest-sample-data

# 或手动摄取
datahub ingest -c <path-to-ingestion-config.yaml>
```

### 7.2 生产环境部署（Kubernetes + Helm）

生产环境推荐使用 **Kubernetes + Helm** 部署，支持高可用、水平扩展、资源隔离。

#### 7.2.1 前置要求

- Kubernetes 集群（1.20+）
- Helm 3.x
- 外部存储（RDS、Elasticsearch 集群、Kafka 集群，可选）
- 足够的资源（CPU、内存、存储）

#### 7.2.2 使用 Helm Charts 部署

**1. 添加 Helm 仓库**：

```bash
helm repo add datahub-helm https://helm.datahubproject.io/
helm repo update
```

**2. 创建 values.yaml**：

```yaml
# values.yaml
global:
  kafka:
    bootstrap:
      server: "kafka:9092"
  elasticsearch:
    host: "elasticsearch"
    port: 9200
  sql:
    datasource:
      host: "mysql"
      port: 3306
      database: "datahub"
      username: "datahub"
      password: "datahub"

datahub-frontend:
  enabled: true
  replicas: 2
  resources:
    requests:
      memory: "512Mi"
      cpu: "250m"
    limits:
      memory: "1Gi"
      cpu: "500m"

datahub-gms:
  enabled: true
  replicas: 2
  resources:
    requests:
      memory: "1Gi"
      cpu: "500m"
    limits:
      memory: "2Gi"
      cpu: "1000m"
```

**3. 安装 DataHub**：

```bash
# 安装
helm install datahub datahub-helm/datahub \
  --namespace datahub \
  --create-namespace \
  -f values.yaml

# 查看状态
helm status datahub -n datahub

# 查看 Pod
kubectl get pods -n datahub
```

#### 7.2.3 配置外部依赖

**使用外部 MySQL**：

```yaml
global:
  sql:
    datasource:
      host: "mysql.example.com"
      port: 3306
      database: "datahub"
      username: "datahub"
      password: "${MYSQL_PASSWORD}"  # 使用 Secret
```

**使用外部 Elasticsearch**：

```yaml
global:
  elasticsearch:
    host: "elasticsearch.example.com"
    port: 9200
    useSSL: true
    auth:
      username: "elastic"
      password: "${ES_PASSWORD}"
```

**使用外部 Kafka**：

```yaml
global:
  kafka:
    bootstrap:
      server: "kafka.example.com:9092"
    schemaRegistry:
      url: "https://schema-registry.example.com"
```

#### 7.2.4 配置认证与授权

**启用 OIDC 认证**：

```yaml
datahub-frontend:
  auth:
    enabled: true
    oidc:
      enabled: true
      discoveryUrl: "https://auth.example.com/.well-known/openid-configuration"
      clientId: "datahub"
      clientSecret: "${OIDC_CLIENT_SECRET}"
```

**配置 RBAC**：

```yaml
datahub-gms:
  authorization:
    enabled: true
    defaultAuthorizer:
      type: "native"
    policies:
      enabled: true
```

### 7.3 组件配置要点

#### 7.3.1 GMS 配置

**关键配置项**：

```yaml
# application.yaml
spring:
  datasource:
    url: "jdbc:mysql://mysql:3306/datahub"
    username: "datahub"
    password: "${DB_PASSWORD}"

kafka:
  bootstrap:
    servers: "kafka:9092"

elasticsearch:
  host: "elasticsearch"
  port: 9200

entityService:
  enableRetention: true  # 启用版本控制
  retention:
    defaultRetention: "P365D"  # 保留 365 天
```

#### 7.3.2 GraphQL 配置

```yaml
graphql:
  server:
    port: 9002
  cors:
    allowedOrigins: "*"  # 生产环境应限制为特定域名
```

#### 7.3.3 前端配置

```yaml
REACT_APP_GMS_HOST: "http://datahub-gms:8080"
REACT_APP_GRAPHQL_HOST: "http://datahub-graphql:9002"
```

### 7.4 监控与运维

#### 7.4.1 健康检查

**GMS 健康检查**：

```bash
curl http://datahub-gms:8080/health
```

**GraphQL 健康检查**：

```bash
curl http://datahub-graphql:9002/health
```

#### 7.4.2 日志管理

**查看 Pod 日志**：

```bash
# 查看 GMS 日志
kubectl logs -f deployment/datahub-gms -n datahub

# 查看前端日志
kubectl logs -f deployment/datahub-frontend -n datahub
```

**日志聚合**：
- 使用 ELK Stack、Loki、Datadog 等工具聚合日志
- 配置日志级别（DEBUG、INFO、WARN、ERROR）

#### 7.4.3 性能监控

**关键指标**：
- **GMS**：请求延迟、吞吐量、错误率
- **Elasticsearch**：查询延迟、索引速度
- **Kafka**：消息延迟、消费速度
- **MySQL**：连接数、查询延迟

**监控工具**：
- Prometheus + Grafana
- DataDog
- New Relic

#### 7.4.4 备份与恢复

**数据库备份**：

```bash
# 备份 MySQL
mysqldump -h mysql.example.com -u datahub -p datahub > backup.sql

# 恢复
mysql -h mysql.example.com -u datahub -p datahub < backup.sql
```

**Elasticsearch 备份**：

```bash
# 使用 Elasticsearch Snapshot API
curl -X PUT "elasticsearch:9200/_snapshot/backup_repo" \
  -H 'Content-Type: application/json' \
  -d '{"type": "fs", "settings": {"location": "/backup"}}'
```

### 7.5 扩容与高可用

#### 7.5.1 水平扩容

**扩容 GMS**：

```bash
kubectl scale deployment datahub-gms --replicas=3 -n datahub
```

**扩容 GraphQL**：

```bash
kubectl scale deployment datahub-graphql --replicas=3 -n datahub
```

**扩容前端**：

```bash
kubectl scale deployment datahub-frontend --replicas=3 -n datahub
```

#### 7.5.2 高可用配置

- **多副本部署**：关键服务至少 2 个副本
- **Pod 反亲和性**：确保 Pod 分布在不同节点
- **健康检查**：配置 liveness 和 readiness probe
- **自动重启**：配置 restartPolicy

### 7.6 安全最佳实践

1. **网络隔离**：使用 Kubernetes NetworkPolicy 限制 Pod 间通信
2. **密钥管理**：使用 Kubernetes Secrets 或外部密钥管理服务（如 Vault）
3. **TLS/SSL**：为所有服务启用 HTTPS
4. **访问控制**：配置 RBAC、OIDC 认证
5. **审计日志**：记录所有元数据变更操作
6. **定期更新**：及时更新 DataHub 版本和安全补丁

### 7.7 故障排查

**常见问题**：

1. **服务无法启动**：
   - 检查资源限制（CPU、内存）
   - 查看 Pod 日志
   - 检查依赖服务（MySQL、Elasticsearch、Kafka）是否正常

2. **搜索功能异常**：
   - 检查 Elasticsearch 连接
   - 查看索引是否正常创建
   - 检查索引映射配置

3. **元数据写入失败**：
   - 检查 Kafka 连接
   - 查看 GMS 日志
   - 验证 Schema 是否符合要求

4. **前端无法访问**：
   - 检查 Ingress/Service 配置
   - 查看前端 Pod 状态
   - 检查 CORS 配置

---

## 8. 扩展点与二次开发实践

> 面向希望在 DataHub 之上做二开的工程师，总结常见扩展场景与推荐实践方式。

### 8.1 扩展场景概览

DataHub 提供了多个扩展点，支持根据业务需求进行定制：

| 扩展场景 | 涉及模块 | 难度 |
|---------|---------|------|
| **新增数据源** | `metadata-ingestion` | 中等 |
| **新增实体类型** | `entity-registry`、`metadata-service`、`datahub-web-react` | 高 |
| **自定义 Transform** | `metadata-ingestion` | 低 |
| **自定义 Actions** | `datahub-actions` | 中等 |
| **前端功能扩展** | `datahub-web-react` | 中等 |
| **自定义 GraphQL Resolver** | `datahub-graphql-core` | 中等 |

### 8.2 新增数据源（Custom Source）

如果需要支持新的数据源，可以开发自定义 Source 插件。

#### 8.2.1 开发步骤

**1. 创建 Source 类**：

```python
# custom_source.py
from typing import Iterable
from datahub.ingestion.api.source import Source, SourceReport
from datahub.ingestion.api.common import WorkUnit
from datahub.metadata.schema_classes import DatasetSnapshot, MetadataChangeEvent

class CustomSource(Source):
    def __init__(self, config):
        self.config = config
        self.report = SourceReport()
    
    @classmethod
    def create(cls, config_dict, ctx):
        config = CustomSourceConfig.parse_obj(config_dict)
        return cls(config)
    
    def get_workunits(self) -> Iterable[WorkUnit]:
        # 1. 连接到数据源
        # 2. 读取元数据
        # 3. 转换为 DataHub 格式
        # 4. 生成 WorkUnit
        
        for table in self._get_tables():
            dataset_snapshot = self._create_dataset_snapshot(table)
            mce = MetadataChangeEvent(proposedSnapshot=dataset_snapshot)
            yield WorkUnit(id=table.urn, mce=mce)
    
    def get_report(self) -> SourceReport:
        return self.report
    
    def _get_tables(self):
        # 实现数据源连接和元数据读取逻辑
        pass
    
    def _create_dataset_snapshot(self, table):
        # 将数据源的表信息转换为 DatasetSnapshot
        pass
```

**2. 定义配置类**：

```python
from pydantic import BaseModel

class CustomSourceConfig(BaseModel):
    host: str
    port: int
    username: str
    password: str
    database: str
```

**3. 注册 Source**：

```python
# 在 setup.py 或 pyproject.toml 中注册
entry_points={
    "datahub.ingestion.source.plugins": [
        "custom-source = custom_source:CustomSource",
    ],
}
```

**4. 使用自定义 Source**：

```yaml
source:
  type: custom-source
  config:
    host: "example.com"
    port: 5432
    username: "user"
    password: "password"
    database: "mydb"
```

#### 8.2.2 参考实现

可以参考 DataHub 内置的 Source 实现：
- `datahub/ingestion/source/mysql.py`
- `datahub/ingestion/source/snowflake.py`

### 8.3 新增实体类型

如果需要支持新的实体类型（如 `CustomEntity`），需要修改多个模块。

#### 8.3.1 在 entity-registry 中定义实体

**1. 定义实体 Schema**：

```yaml
# entity-registry/src/main/pegasus/com/datahub/metadata/entity/CustomEntity.pdl
namespace com.datahub.metadata.entity

/**
 * CustomEntity represents a custom entity type
 */
@entity.urn = "urn:li:customEntity"
record CustomEntity {
  /** The unique identifier for the custom entity */
  @entity.urn = "urn"
  urn: string
  
  /** The name of the custom entity */
  name: string
  
  /** The description of the custom entity */
  description: optional string
}
```

**2. 定义 Aspect**：

```yaml
# entity-registry/src/main/pegasus/com/datahub/metadata/aspect/CustomEntityAspect.pdl
namespace com.datahub.metadata.aspect

/**
 * CustomEntityAspect contains metadata for CustomEntity
 */
record CustomEntityAspect {
  /** Custom properties */
  properties: map[string] = {}
}
```

**3. 运行代码生成**：

```bash
./gradlew :entity-registry:generateDataTemplate
```

#### 8.3.2 更新 metadata-service

**1. 添加实体服务**：

```java
// metadata-service/src/main/java/com/datahub/service/CustomEntityService.java
@Service
public class CustomEntityService {
    
    @Autowired
    private EntityService entityService;
    
    public CustomEntity getCustomEntity(String urn) {
        // 实现获取逻辑
    }
    
    public void updateCustomEntity(String urn, CustomEntityAspect aspect) {
        // 实现更新逻辑
    }
}
```

**2. 更新搜索索引配置**：

```yaml
# 在 Elasticsearch mapping 中添加 CustomEntity 的索引配置
```

#### 8.3.3 更新 GraphQL Schema

**1. 添加 GraphQL 类型**：

```graphql
type CustomEntity implements Entity {
  urn: String!
  name: String!
  description: String
  properties: [Property!]!
}

type Query {
  customEntity(urn: String!): CustomEntity
  searchCustomEntities(input: SearchInput!): SearchResults
}
```

**2. 实现 Resolver**：

```java
@GraphQLResolver
public class CustomEntityResolver {
    
    @Autowired
    private CustomEntityService customEntityService;
    
    public CustomEntity customEntity(String urn) {
        return customEntityService.getCustomEntity(urn);
    }
}
```

#### 8.3.4 更新前端

**1. 创建实体详情页**：

```typescript
// datahub-web-react/src/pages/entity/customEntity/CustomEntityPage.tsx
export const CustomEntityPage: React.FC<{ urn: string }> = ({ urn }) => {
  const { data } = useGetCustomEntityQuery({ variables: { urn } });
  
  return (
    <div>
      <h1>{data?.customEntity?.name}</h1>
      {/* 渲染实体详情 */}
    </div>
  );
};
```

**2. 更新路由**：

```typescript
// 在路由配置中添加 CustomEntity 的路由
{
  path: '/entity/customEntity/:urn',
  component: CustomEntityPage,
}
```

### 8.4 自定义 Transform

Transform 用于在 ingestion 过程中转换元数据。

#### 8.4.1 开发自定义 Transform

```python
from typing import List
from datahub.ingestion.transformer.base_transformer import (
    BaseTransformer,
    SingleAspectTransformer,
)
from datahub.metadata.schema_classes import (
    DatasetSnapshot,
    MetadataChangeEvent,
)

class CustomTransform(BaseTransformer):
    @classmethod
    def create(cls, config_dict, ctx):
        config = CustomTransformConfig.parse_obj(config_dict)
        return cls(config)
    
    def transform_one(self, mce: MetadataChangeEvent) -> MetadataChangeEvent:
        if isinstance(mce.proposedSnapshot, DatasetSnapshot):
            # 修改 DatasetSnapshot
            # 例如：添加默认标签
            if mce.proposedSnapshot.aspects:
                for aspect in mce.proposedSnapshot.aspects:
                    if isinstance(aspect, TagsClass):
                        # 添加标签逻辑
                        pass
        return mce
```

**使用 Transform**：

```yaml
transformers:
  - type: custom-transform
    config:
      # 配置项
```

### 8.5 自定义 Actions（事件驱动）

DataHub Actions 允许在元数据变更时触发自动化动作。

#### 8.5.1 开发自定义 Action

```python
from datahub.actions.action import Action
from datahub.metadata.schema_classes import MetadataChangeEvent

class CustomAction(Action):
    @classmethod
    def create(cls, config_dict):
        config = CustomActionConfig.parse_obj(config_dict)
        return cls(config)
    
    def act(self, event: MetadataChangeEvent) -> None:
        # 处理元数据变更事件
        # 例如：发送通知、创建工单、更新外部系统等
        if event.proposedSnapshot:
            entity_urn = event.proposedSnapshot.urn
            # 执行自定义逻辑
            self._send_notification(entity_urn)
    
    def _send_notification(self, urn: str):
        # 实现通知逻辑
        pass
```

**配置 Action**：

```yaml
# actions.yaml
action:
  type: custom-action
  config:
    # 配置项
```

**运行 Action**：

```bash
datahub actions -c actions.yaml
```

#### 8.5.2 常见 Action 场景

- **自动标签**：根据规则自动为实体添加标签
- **通知**：元数据变更时发送邮件/Slack 通知
- **合规检查**：检查元数据是否符合合规要求
- **外部同步**：将元数据同步到外部系统（如 ServiceNow、Jira）

### 8.6 前端功能扩展

#### 8.6.1 添加新页面

参考第 6.3.2 节的说明。

#### 8.6.2 自定义实体展示组件

```typescript
// src/components/entity/CustomEntityCard.tsx
export const CustomEntityCard: React.FC<{ entity: CustomEntity }> = ({ entity }) => {
  return (
    <Card>
      <Card.Header>{entity.name}</Card.Header>
      <Card.Body>
        {/* 自定义展示逻辑 */}
      </Card.Body>
    </Card>
  );
};
```

### 8.7 最佳实践

1. **遵循 DataHub 的架构模式**：
   - 使用 Aspect 模式存储元数据
   - 遵循 URN 命名规范
   - 使用标准的 GraphQL Schema

2. **测试**：
   - 为自定义 Source/Transform/Action 编写单元测试
   - 进行集成测试，验证端到端流程

3. **文档**：
   - 为自定义扩展编写文档
   - 提供配置示例和使用说明

4. **贡献回社区**：
   - 如果扩展具有通用性，考虑贡献给 DataHub 社区
   - 提交 PR 到 `contrib/` 目录

### 8.8 参考资源

- **DataHub Contrib 目录**：`contrib/` 中包含社区贡献的扩展示例
- **DataHub Actions 仓库**：`acryldata/datahub-actions` 包含 Actions 框架的详细文档
- **官方文档**：`docs.datahub.com` 中的 "Extending DataHub" 章节

---

## 9. 学习路径与参考资料

> 汇总从"快速上手 → 深入源码 → 生产部署"的推荐学习路径与官方资源。

### 9.1 推荐学习路径

#### 阶段 1：快速体验与核心概念（1-2 天）

**目标**：快速了解 DataHub 的功能和基本使用方式。

**任务清单**：
1. ✅ 阅读本指南第 1-3 章，了解 DataHub 的整体架构
2. ✅ 使用 Docker 快速启动 DataHub：
   ```bash
   datahub docker quickstart
   ```
3. ✅ 访问 Web UI（http://localhost:9002），体验搜索、浏览、血缘等功能
4. ✅ 摄取示例数据：
   ```bash
   datahub docker ingest-sample-data
   ```
5. ✅ 阅读官方 Quickstart 文档：https://datahubproject.io/docs/quickstart

**预期成果**：
- 理解 DataHub 的核心功能（搜索、血缘、治理）
- 熟悉 Web UI 的基本操作
- 了解元数据的基本概念（实体、标签、Owner、Glossary）

#### 阶段 2：Ingestion 与元数据模型理解（3-5 天）

**目标**：掌握如何从上游系统采集元数据，理解元数据模型。

**任务清单**：
1. ✅ 阅读本指南第 4-5 章
2. ✅ 学习 Ingestion 框架：
   - 阅读官方 Ingestion 文档：https://datahubproject.io/docs/metadata-ingestion
   - 尝试配置一个简单的 Source（如 MySQL）
   - 运行 ingestion 任务，验证元数据是否成功采集
3. ✅ 理解元数据模型：
   - 查看 `entity-registry` 中的实体定义
   - 理解 URN、Aspect、实体类型等概念
   - 尝试使用 DataHub CLI 查询实体：`datahub get --urn <urn>`
4. ✅ 实践练习：
   - 为你的数据源（数据库、数据仓库等）配置 ingestion
   - 验证元数据是否正确采集和展示

**预期成果**：
- 能够独立配置和运行 ingestion 任务
- 理解 DataHub 的元数据模型结构
- 能够使用 DataHub CLI 进行基本操作

#### 阶段 3：深入后端服务与前端代码（1-2 周）

**目标**：深入理解 DataHub 的实现细节，能够阅读和修改源码。

**任务清单**：
1. ✅ 阅读本指南第 4、6 章
2. ✅ 研究后端服务：
   - 阅读 `metadata-service` 的代码结构
   - 理解 GMS 的元数据存储和查询流程
   - 研究 GraphQL API 的实现（`datahub-graphql-core`）
3. ✅ 研究前端代码：
   - 阅读 `datahub-web-react` 的代码结构
   - 理解前端如何通过 GraphQL 与后端交互
   - 尝试修改前端页面，添加自定义功能
4. ✅ 实践练习：
   - 在本地构建和运行 DataHub
   - 修改某个功能，验证修改是否生效
   - 阅读并理解一个完整的 Feature 实现（从 ingestion 到前端展示）

**预期成果**：
- 能够阅读和理解 DataHub 的核心代码
- 能够进行简单的功能修改和扩展
- 理解 DataHub 的内部架构和数据流

#### 阶段 4：部署、运维与二次扩展（1-2 周）

**目标**：掌握生产环境部署和二次开发能力。

**任务清单**：
1. ✅ 阅读本指南第 7-8 章
2. ✅ 学习生产部署：
   - 阅读 Kubernetes + Helm 部署文档
   - 在测试环境部署 DataHub
   - 配置监控、日志、备份等运维工具
3. ✅ 学习二次开发：
   - 尝试开发一个自定义 Source
   - 尝试开发一个自定义 Action
   - 尝试添加一个新的实体类型（可选，较复杂）
4. ✅ 实践练习：
   - 在生产环境部署 DataHub
   - 开发一个满足业务需求的自定义扩展
   - 编写扩展的文档和测试

**预期成果**：
- 能够独立部署和维护 DataHub 生产环境
- 能够开发自定义扩展，满足业务需求
- 理解 DataHub 的扩展机制和最佳实践

### 9.2 官方资源

#### 9.2.1 核心资源

| 资源 | 链接 | 说明 |
|-----|------|------|
| **GitHub 仓库** | https://github.com/datahub-project/datahub | 源代码仓库 |
| **官方文档** | https://datahubproject.io/docs | 完整的官方文档 |
| **快速开始** | https://datahubproject.io/docs/quickstart | 快速上手指南 |
| **Demo 环境** | https://demo.datahubproject.io | 在线演示环境 |
| **Slack 社区** | https://slack.datahubproject.io | 社区讨论和问答 |

#### 9.2.2 文档分类

**入门文档**：
- Quickstart Guide
- Architecture Overview
- Features & Roadmap

**使用文档**：
- Ingestion Guides（各种数据源的 ingestion 配置）
- UI Guide（Web UI 使用说明）
- CLI Reference（命令行工具参考）

**开发文档**：
- Development Guide（本地开发环境搭建）
- Extending DataHub（扩展开发指南）
- Contributing Guidelines（贡献指南）

**部署文档**：
- Docker Deployment
- Kubernetes Deployment
- Production Best Practices

#### 9.2.3 相关仓库

| 仓库 | 链接 | 说明 |
|-----|------|------|
| **datahub-actions** | https://github.com/acryldata/datahub-actions | Actions 框架 |
| **datahub-helm** | https://github.com/acryldata/datahub-helm | Helm Charts |
| **meta-world** | https://github.com/acryldata/meta-world | 社区扩展和配方 |

### 9.3 社区资源

#### 9.3.1 博客与文章

**官方博客**：
- DataHub Blog：https://blog.datahubproject.io
- LinkedIn Engineering Blog：包含多篇 DataHub 相关文章

**精选文章**：
- "DataHub: Popular Metadata Architectures Explained"（架构解析）
- "The evolution of metadata: LinkedIn's story"（演进历程）
- "DataHub Journey with Expedia Group"（企业实践案例）

#### 9.3.2 视频与演讲

**YouTube 频道**：
- DataHub YouTube Channel：https://www.youtube.com/c/DataHubProject

**精选演讲**：
- Strata Data Conference 2019：The evolution of metadata
- Crunch Data Conference 2019：Journey of metadata at LinkedIn
- DataOps Unleashed 2021：Driving DataOps Culture with LinkedIn DataHub

#### 9.3.3 社区活动

- **Town Hall**：每月第 4 个星期四 9am US PT
  - Zoom 链接：https://zoom.datahubproject.io
  - 会议记录和回放：查看官方文档

### 9.4 学习建议

1. **循序渐进**：
   - 不要一开始就深入源码，先理解整体架构和使用方式
   - 从简单的 ingestion 配置开始，逐步深入

2. **实践为主**：
   - 理论学习的同时，一定要动手实践
   - 尝试在自己的环境中部署和使用 DataHub

3. **参与社区**：
   - 加入 Slack 社区，与其他用户交流
   - 参加 Town Hall，了解最新动态
   - 阅读 Issues 和 PR，了解社区讨论

4. **阅读源码**：
   - 从简单的模块开始（如 ingestion Source）
   - 使用 IDE 的调试功能，跟踪代码执行流程
   - 参考官方文档，理解设计思路

5. **贡献代码**：
   - 从小的 Bug Fix 或文档改进开始
   - 参考 Contributing Guidelines
   - 提交 PR，获得代码审查反馈

### 9.5 常见问题 FAQ

**Q: DataHub 支持哪些数据源？**
A: DataHub 支持 50+ 种数据源，包括关系型数据库、数据仓库、BI 工具、ML 平台等。完整列表见：https://datahubproject.io/docs/metadata-ingestion/source_docs

**Q: 如何自定义实体类型？**
A: 需要修改 `entity-registry`、`metadata-service`、`datahub-graphql-core` 和 `datahub-web-react` 等多个模块。详见本指南第 8.3 节。

**Q: DataHub 的性能如何？**
A: DataHub 支持水平扩展，可以通过增加副本数提升性能。对于大规模部署，建议使用外部存储（RDS、Elasticsearch 集群等）。

**Q: 如何备份和恢复 DataHub？**
A: 主要需要备份 MySQL 数据库和 Elasticsearch 索引。详见本指南第 7.4.4 节。

**Q: DataHub 是否支持多租户？**
A: DataHub 支持通过 Domain 和 Policies 实现多租户隔离。详见官方文档的 Governance 章节。

### 9.6 版本信息

**文档版本**：v1.0  
**DataHub 版本**：基于最新稳定版（建议查看 GitHub Releases）  
**最后更新**：2025-01-XX  
**维护者**：内部团队

---

## 附录：文档维护说明

### 更新记录

- **v1.0**（2025-01-XX）：初始版本，涵盖 DataHub 的核心架构、使用和扩展

### 反馈与贡献

如果发现文档中的错误或需要补充的内容，请：
1. 提交 Issue 或 PR
2. 联系文档维护者

### 相关文档

- 本指南侧重于**系统性学习**，适合深入理解 DataHub
- 对于**快速上手**，建议参考官方 Quickstart 文档
- 对于**具体功能使用**，建议参考官方文档的对应章节

---

**文档结束**

> 希望本指南能帮助你系统地学习和掌握 DataHub！如有问题，欢迎参考官方文档或加入社区讨论。


