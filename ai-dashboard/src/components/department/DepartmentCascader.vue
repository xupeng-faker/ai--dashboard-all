<template>
  <el-cascader
    v-model="selectedPath"
    :options="departmentTree"
    :props="cascaderProps"
    :loading="loading"
    placeholder="可选择至六级部门"
    clearable
    separator=" / "
    style="width: 100%"
    @change="handleChange"
  />
</template>

<script setup lang="ts">
import { computed, onActivated, watch } from 'vue'
import { useDepartmentFilter } from '@/composables/useDepartmentFilter'

interface Props {
  modelValue?: string[]
}

interface Emits {
  (e: 'update:modelValue', value: string[]): void
  (e: 'change', value: string[]): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
})

const emit = defineEmits<Emits>()

const {
  loading,
  departmentTree,
  selectedDepartmentPath,
  initDepartmentTree,
  refreshDepartmentTree,
  cascaderProps,
} = useDepartmentFilter()

// 初始化部门树（加载一级和二级部门作为默认值）
initDepartmentTree()

onActivated(() => {
  refreshDepartmentTree()
})

// 同步外部传入的值
const selectedPath = computed({
  get: () => props.modelValue,
  set: (value) => {
    selectedDepartmentPath.value = value || []
    emit('update:modelValue', value || [])
  },
})

// 监听内部选中值变化
watch(
  () => selectedDepartmentPath.value,
  (newValue) => {
    if (newValue !== props.modelValue) {
      emit('update:modelValue', newValue)
    }
  }
)

const handleChange = (value: string[]) => {
  selectedDepartmentPath.value = value || []
  emit('change', value || [])
}
</script>

