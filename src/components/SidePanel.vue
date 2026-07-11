<script setup lang="ts">
import { computed, ref } from 'vue'
import Outline from '@/components/sidebar/outline/Outline.vue'
import VersionHistory from '@/components/sidebar/version/VersionHistory.vue'
import { useWindowStore } from '@/stores/windowStore'
import FileTree from '@/components/sidebar/filetree/FileTree.vue'
import BottomBar from '@/components/bottombar/BottomBar.vue'

const uiStore = useWindowStore()
const isHovering = ref(false)

const activePanel = computed(() => uiStore.state.sidebar.activePanel)

const componentMap: Record<string, any> = {
  fileTree: FileTree,
  outline: Outline,
  history: VersionHistory
}

const currentComponent = computed(() => componentMap[activePanel.value])

const handleMouseEnter = () => {
  isHovering.value = true
}

const handleMouseLeave = () => {
  isHovering.value = false
}
</script>

<template>
  <div class="side-panel h-full flex flex-col" @mouseenter="handleMouseEnter" @mouseleave="handleMouseLeave">
    <div class="flex-1 overflow-hidden">
      <component :is="currentComponent" class="h-full" :buttonShow="isHovering" />
    </div>
    <BottomBar v-show="isHovering" />
  </div>
</template>

<style scoped>
.side-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
