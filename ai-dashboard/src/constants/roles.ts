import type { RoleValue, SelectOption } from '@/types/dashboard'

const ROLE_VALUE_MAP: Record<string, RoleValue> = {
  全员: '0',
  干部: '1',
  专家: '2',
  基层主管: '3',
}

export const normalizeRoleOptions = (
  options: SelectOption<string>[] = []
): SelectOption<RoleValue>[] => {
  return options.map((option) => {
    const mappedValue = ROLE_VALUE_MAP[option.label]
    if (mappedValue) {
      return {
        ...option,
        value: mappedValue,
      }
    }
    return {
      ...option,
      value: option.value as RoleValue,
    }
  })
}

export const getRoleValueByLabel = (label: string): RoleValue | undefined => ROLE_VALUE_MAP[label]

