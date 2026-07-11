<script setup lang="ts">
import { Folder, List, Clock } from '@element-plus/icons-vue'

const props = defineProps<{
  name: string
  label: string
  icon: string
  active: boolean
}>()

const emit = defineEmits<{
  (e: 'click'): void
}>()

const iconMap: Record<string, any> = {
  Folder,
  List,
  Clock
}
</script>

<template>
  <el-tooltip :content="label" placement="top">
    <div 
      class="bottom-bar-icon flex-1 flex items-center justify-center h-8 cursor-pointer transition-colors"
      :class="{ 'text-primary': active, 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200': !active }"
      @click="emit('click')"
    >
      <el-icon :size="18">
        <component :is="iconMap[icon]" />
      </el-icon>
    </div>
  </el-tooltip>
</template>

<style scoped>
.bottom-bar-icon {
  margin: 0 4px;
  border-radius: 4px;
}

.bottom-bar-icon:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.dark .bottom-bar-icon:hover {
  background-color: rgba(255, 255, 255, 0.05);
}
</style>
