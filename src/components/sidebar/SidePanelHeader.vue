<script setup lang="ts">
import type { PropType } from 'vue'
type Button = {
  label: string
  icon: any
  click: () => void
}
const props = defineProps({
  title: {
    type: String,
  },
  buttons: {
    type: Array as PropType<Button[]>,
    default: () => [],
  },
  buttonShow: {
    type: Boolean,
    default: true,
  },
})

</script>

<template>
  <div class="side-panel-header">
    <span class="header-title">{{ title }}</span>
    <div v-show="buttonShow" class="header-actions">
      <el-tooltip v-for="button in buttons" :content="button.label" placement="top">
        <div class="header-icon-btn" @click="button.click">
          <el-icon>
            <component :is="button.icon" />
          </el-icon>
        </div>
      </el-tooltip>
    </div>
  </div>
</template>

<style scoped>
.side-panel-header {
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  border-bottom: 1px solid var(--el-border-color);
  background-color: var(--el-bg-color);
  flex-shrink: 0;
}

.header-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.header-actions {
  display: flex;
  gap: 4px;
}

.header-icon-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  cursor: pointer;
  color: var(--el-text-color-regular);
  transition: all 0.2s;
}

.header-icon-btn:hover {
  background-color: rgba(0, 0, 0, 0.05);
  color: var(--el-text-color-primary);
}

.dark .header-icon-btn:hover {
  background-color: rgba(255, 255, 255, 0.05);
}
</style>
