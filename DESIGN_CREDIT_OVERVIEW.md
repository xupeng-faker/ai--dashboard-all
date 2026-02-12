# 学分总览功能设计文档

## 1. 需求分析
用户需要查看“职位学分总览”和“部门学分总览”两个维度的统计表格。
主要目的是监控各部门和职位的学分达成情况，并结合当前时间进度进行预警。
**新增需求**：
1.  支持部门筛选，且支持下钻查询（选中部门显示其下级部门汇总）。
2.  部门筛选默认选中“ICT BG / 云核心网产品线（默认编码为0）”。
3.  将“部门学分总览”和“岗位学分总览”合并在“全员学分总览”板块下。
4.  在“全员学分总览”板块顶部增加“角色视图”筛选（参考全员任职/认证趋势）。

### 1.1 统计维度
1.  **职位维度**：按岗位类别（Job Category）统计。
2.  **部门维度**：按部门（Department）统计，动态展示选定部门的下一级子部门。

### 1.2 统计指标（表格字段）
1.  **类别名称**：部门名称 或 职位类别名称。
2.  **基线人数**：该类别下的总人数。
3.  **个人最高分**：该类别下个人的最高当前学分。
4.  **个人最低分**：该类别下个人的最低当前学分。
5.  **学分达成率**：$\frac{\text{已达标人数}}{\text{基线人数}} \times 100\%$
    *   *达标定义*：个人当前学分 $\ge$ 个人目标学分。
6.  **时间进度学分目标**：$\frac{\text{当前是一年中的第几天}}{\text{全年总天数}} \times 100\%$
    *   这是一个随时间变化的全局参考值。
7.  **学分状态预警**：
    *   逻辑：若 **学分达成率** $<$ **时间进度学分目标**，则标记为“预警”状态。

---

## 2. 数据库设计 (Database Design)

`t_personal_credit` 表已包含职位相关字段（由用户确认），无需进行表结构变更。
但需要在 Java 实体类中添加对应映射以便后续查询使用。

### 2.1 现有表结构确认
表 `t_personal_credit` 应包含以下字段：
*   `job_category`: 岗位类别
*   `job_subcategory`: 岗位子类
*   部门层级字段：`l0_department_code`, `firstdeptcode` ... `sixthdeptcode`，以及 `lowest_dept_number`。

### 2.2 实体类变更 (`PersonalCredit.java`)
需要在实体类中添加 `jobCategory` 和 `jobSubcategory` 属性，并更新 Mapper XML 进行映射。

---

## 3. 后端接口设计 (API Design)

新增 `PersonalCreditStatisticsController` 用于处理统计请求。

### 3.1 基础说明
所有统计接口均应支持部门筛选。前端传递 `deptCode`，后端需根据该 `deptCode` 过滤数据。
通常部门筛选逻辑为：该 `deptCode` 对应的层级字段等于该值，或者该部门是其上级部门。
在 `t_personal_credit` 表中，有 `firstdeptcode` 到 `sixthdeptcode`。如果传入一个部门编码，我们需要知道它是哪一层的，或者在所有层级字段中进行匹配。
**简化策略**：假设前端传递的部门筛选会带上层级信息，或者后端通过 `lowest_dept_number` 或模糊匹配处理。更稳健的方式是匹配所有层级列：`WHERE (firstdeptcode = #{deptCode} OR seconddeptcode = #{deptCode} ...)`。

### 3.2 部门学分总览接口
*   **URL**: `/api/credit/statistics/department`
*   **Method**: `GET`
*   **Params**: 
    *   `deptCode` (可选): 部门编码。
*   **Response**: `Result<CreditStatisticsResponseVO>`
*   **逻辑说明**：
    *   如果 `deptCode` 为空或 "0"，默认视为查询“ICT BG / 云核心网产品线”。后端应将其映射为云核心网产品线的真实编码，并返回其下级（即4级部门）的汇总数据。
    *   如果 `deptCode` 不为空且不为 "0"，则查询该真实部门编码的**下一级子部门**的汇总数据。
    *   `level` 参数不再由前端传递，由后端根据 `deptCode` 自动计算。

### 3.3 响应对象 VO 定义

**1. 统计项 VO (`CreditOverviewVO`)**
```java
public class CreditOverviewVO {
    private String categoryName;      // 部门名称 或 职位类别名称
    private Integer baselineHeadcount; // 基线人数
    private BigDecimal maxScore;       // 个人最高分
    private BigDecimal minScore;       // 个人最低分
    private BigDecimal achievementRate; // 学分达成率 (%)
    private BigDecimal timeProgress;    // 时间进度 (%)
    private Boolean isWarning;          // 是否预警 (true=预警)
}
```

**2. 响应包装 VO (`CreditStatisticsResponseVO`)**
参考 `CompetenceCategoryCertStatisticsResponseVO` 的结构，便于前端统一处理。
```java
public class CreditStatisticsResponseVO {
    private String deptCode;          // 当前统计的部门编码
    private String deptName;          // 当前统计的部门名称
    private List<CreditOverviewVO> statistics; // 各分类（部门/职位）的统计列表
    private CreditOverviewVO totalStatistics;  // 总计统计信息
}
```

### 3.4 接口定义更新

**1. 部门学分总览接口**
*   **URL**: `/api/credit/statistics/department`
*   **Method**: `GET`
*   **Params**: 
    *   `deptCode` (可选): 部门编码。
*   **Response**: `Result<CreditStatisticsResponseVO>`

**2. 职位学分总览接口**
*   **URL**: `/api/credit/statistics/position`
*   **Method**: `GET`
*   **Params**:
    *   `deptCode` (可选): 部门编码。
*   **Response**: `Result<CreditStatisticsResponseVO>`


### 3.5 业务逻辑 (`PersonalCreditService`)
*   **响应封装**：
    *   查询出列表后，需计算 `totalStatistics`（总计行）。
    *   填充 `deptCode` 和 `deptName`（需调用 `DepartmentService` 或查询部门表获取名称）。
*   **筛选逻辑**：
    *   若 `deptCode` 不为空，需查询该部门及其所有子部门的数据。
    *   在 SQL 中，可以使用动态 `WHERE` 子句：
        ```sql
        <if test="deptCode != null and deptCode != ''">
            AND (
                l0_department_code = #{deptCode} OR
                firstdeptcode = #{deptCode} OR
                seconddeptcode = #{deptCode} OR
                thirddeptcode = #{deptCode} OR
                fourthdeptcode = #{deptCode} OR
                fifthdeptcode = #{deptCode} OR
                sixthdeptcode = #{deptCode}
            )
        </if>
        ```
*   **部门下钻逻辑**：
    *   `getDepartmentStatistics` 需要根据传入的 `deptCode` 判断其层级，然后统计下一级部门的数据。
    *   如果 `deptCode` 为空或为 "0"，**默认查询“ICT BG / 云核心网产品线”下的4级部门汇总数据**。
        *   实际上“云核心网产品线”通常对应一个具体的 `deptCode`（如 `106828`）。如果 `deptCode` 为空或 "0"，后端应将其替换为默认的云核心网产品线编码，然后按该部门的下级（即4级部门）进行统计。
    *   如果 `deptCode` 不为 "0" 且不为空，则查询该部门的**下一级子部门**的汇总数据。
    *   后端需自动判断当前部门的层级（例如查询部门表），然后统计 `current_level + 1` 的部门数据。

*   **聚合逻辑**：
    *   使用 MyBatis `GROUP BY` 查询。
    *   `achievementRate` 计算：`SUM(CASE WHEN current_credit >= target_credit THEN 1 ELSE 0 END) / COUNT(*)`
    *   `timeProgress` 计算：`DayOfYear / 365`。

---

## 4. 前端设计 (Frontend Design)

### 4.1 页面结构
在 `src/views/dashboard` 下新增 `CreditOverview.vue`。
参考 `CertificationDashboard.vue` 中“全员任职/认证趋势”内容块的设计风格。

*   **布局**：
    *   **Header 区域**：标题“学分总览”与描述信息，右侧可放置全局操作按钮（如导出）。
    *   **筛选区域**：
        *   复用 `CertificationDashboard.vue` 或 `SchoolDashboard.vue` 中的部门筛选组件。
        *   **默认选中**：ICT BG / 云核心网产品线。
        *   **交互逻辑**：选中部门后，自动计算下一级部门层级，并调用 `getDepartmentStatistics(level, deptCode)`。
        *   **新增**：角色视图筛选（全员/干部/专家/基层主管），放在全员学分总览顶部。
    *   **内容区域**：
        *   **全员学分总览**（包含“部门学分总览”和“职位学分总览”两个子表格）。
        *   参考“全员任职/认证趋势”，将角色视图筛选放在该模块的 Header 中。
*   **板块设计**：
    *   外部容器使用 `el-card` 包裹，标题为“全员学分总览”。
    *   Card Header：
        *   左侧：标题“全员学分总览”。
        *   右侧：角色视图筛选器。
    *   Card Body：
        *   上部：部门学分总览表格。
        *   下部：职位学分总览表格。

### 4.2 表格组件 (`CreditOverviewTable.vue`)
参考 `CertificationDashboard.vue` 中表格的实现。

*   **Props**:
    *   `title`: 表格标题（用于 Card Header 显示）。
    *   `data`: 表格数据列表。
    *   `loading`: 加载状态。
    *   `type`: 'position' | 'department' (用于区分展示细节)。
*   **Columns**:
    *   Category (Label: "部门/职位", align: center)
    *   Baseline Count (Label: "基线人数", align: center)
    *   Max Score (Label: "最高分", align: center)
    *   Min Score (Label: "最低分", align: center)
    *   Achievement Rate (Label: "达成率", Formatter: Percentage, align: center)
    *   Time Progress (Label: "时间进度", Formatter: Percentage, align: center)
    *   Status (Label: "状态", align: center)
        *   使用 `el-tag`。
        *   Red ("预警") if `isWarning` is true.
        *   Green ("正常") otherwise.
*   **Style**:
    *   Header Cell: `background: 'rgba(58, 122, 254, 0.06)', color: '#2f3b52'`
    *   支持合计行（如果需要）。

### 4.3 路由配置
在 `src/router/index.ts` 中添加路由 `/dashboard/credit-overview`。

---

## 5. 开发计划 (Implementation Steps)
1.  **Backend**: 更新 `PersonalCreditMapper.xml`，在统计查询中添加 `deptCode` 筛选条件的 SQL 片段。
2.  **Backend**: 更新 `PersonalCreditMapper.java` 接口，增加 `deptCode` 参数。
3.  **Backend**: 更新 `PersonalCreditService` 和 `Controller`，支持传递 `deptCode`。
4.  **Frontend**: 更新 `api/dashboard_credit.ts`，支持传递部门参数。
5.  **Frontend**: 在 `SchoolDashboard.vue` 中，监听部门筛选器的变化，并将选中的 `deptCode` 传递给统计接口。
6.  **Integration**: 联调验证部门筛选是否生效。
