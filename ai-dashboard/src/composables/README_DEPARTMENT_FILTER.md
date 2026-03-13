# 部门筛选功能使用说明

## 概述

部门筛选功能支持六级部门的多级查询，通过懒加载方式获取部门数据。

**注意**：一级和二级部门已写死为固定值，且不可选择：
- 一级部门：ICT BG（禁用，不可选择）
- 二级部门：云核心网产品线（禁用，不可选择）
- 三级部门：通过 `deptId=0` 查询获取（可选择）
- 四级及以下部门：通过 API 接口懒加载获取（可选择）

## API 接口

### 接口地址
```
GET /ai_transform_webapi/department-info/children?deptId={deptId}
```

### 请求参数
- `deptId` (可选): 部门ID（部门编码），为空或"0"时查询一级部门，默认为"031562"

### 响应格式
```typescript
{
  code: number,
  message: string,
  data: DepartmentInfoVO[]
}
```

### DepartmentInfoVO 结构
```typescript
{
  deptCode: string,        // 部门ID（部门编码）
  deptName: string,        // 部门中文名
  deptLevel: string,       // 部门层级
  parentDeptCode?: string, // 父部门编码
  children?: DepartmentInfoVO[] // 子部门列表
}
```

## 使用方法

### 方法一：使用 Composable

```vue
<template>
  <el-cascader
    v-model="selectedPath"
    :options="departmentTree"
    :props="cascaderProps"
    :loading="loading"
    placeholder="可选择至六级部门"
    clearable
    separator=" / "
  />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useDepartmentFilter } from '@/composables/useDepartmentFilter'

const {
  loading,
  departmentTree,
  selectedDepartmentPath,
  initDepartmentTree,
  cascaderProps,
} = useDepartmentFilter()

const selectedPath = ref<string[]>([])

onMounted(() => {
  // 初始化部门树（一级和二级部门已写死且不可选择，三级部门通过 deptId=0 查询）
  initDepartmentTree()
})
</script>
```

### 方法二：使用封装好的组件

```vue
<template>
  <DepartmentCascader v-model="selectedDepartmentPath" @change="handleDepartmentChange" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DepartmentCascader from '@/components/department/DepartmentCascader.vue'

const selectedDepartmentPath = ref<string[]>([])

const handleDepartmentChange = (value: string[]) => {
  console.log('选中的部门路径:', value)
  // value 是一个数组，例如: ['deptCode1', 'deptCode2', 'deptCode3']
}
</script>
```

## Composable API

### useDepartmentFilter()

返回以下属性和方法：

#### 属性
- `loading: Ref<boolean>` - 加载状态
- `departmentTree: Ref<DepartmentNode[]>` - 部门树数据
- `selectedDepartmentPath: Ref<string[]>` - 选中的部门路径
- `cascaderProps: ComputedRef` - Element Plus Cascader 组件的 props 配置

#### 方法
- `initDepartmentTree(): Promise<void>` - 初始化部门树（加载一级和二级部门作为默认值）
- `loadRootDepartments(): Promise<void>` - 加载一级部门
- `loadChildDepartments(deptCode: string, parentNode?: DepartmentNode): Promise<DepartmentNode[]>` - 根据部门编码加载子部门
- `lazyLoadDepartments(node: DepartmentNode, resolve: Function): Promise<void>` - 懒加载部门数据（用于 Element Plus Cascader）
- `getLevel3Departments(deptPath: string[]): Promise<DepartmentNode[]>` - 根据部门路径查询三级部门数据
- `resetFilter(): void` - 重置筛选条件

## 特性说明

1. **默认值加载**: 初始化时自动加载一级和二级部门数据
2. **懒加载**: 三级及以下部门采用懒加载方式，只有在用户展开时才请求数据
3. **多级查询**: 支持通过 `deptCode` 进行多级查询
4. **类型安全**: 完整的 TypeScript 类型定义

## 注意事项

1. 确保后端接口 `/ai_transform_webapi/department-info/children` 可正常访问
2. 接口返回的数据格式需要符合 `DepartmentInfoVO` 结构
3. 当 `deptId` 为空或"0"时，后端会使用默认值"031562"查询一级部门

