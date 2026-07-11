<script setup lang="ts">
import { useBottomBar } from './composable/useBottomBar'
import BottomBarButton from './BottomBarButton.vue'

const { activePanel, panels, switchPanel } = useBottomBar()
</script>

<template>
  <div class="bottom-bar flex">
    <BottomBarButton
      v-for="panel in panels"
      :key="panel.name"
      :name="panel.name"
      :label="panel.label"
      :icon="panel.icon"
      :active="activePanel === panel.name"
      @click="switchPanel(panel.name)"
    />
  </div>
</template>

<style scoped>
.bottom-bar {
  padding: 4px;
  border-top: 1px solid var(--el-border-color);
  background-color: var(--el-bg-color);
}
</style>
