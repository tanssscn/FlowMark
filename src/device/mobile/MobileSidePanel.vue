<script setup lang="ts">
import { computed } from 'vue'
import Outline from '@/components/sidebar/outline/Outline.vue'
import VersionHistory from '@/components/sidebar/version/VersionHistory.vue'
import { useMobileNav } from './composable/useMobileNav'

const { activePanel, closePanel } = useMobileNav()

const popupShow = computed({
  get: () => activePanel.value !== null,
  set: (value) => {
    if (!value) {
      closePanel()
    }
  }
})

const currentComponent = computed(() => {
  if (activePanel.value === 'outline') return Outline
  if (activePanel.value === 'version') return VersionHistory
  return null
})
</script>

<template>
  <van-popup v-model:show="popupShow" position="right" :overlay="true" :close-on-click-overlay="true"
    class="mobile-side-panel-popup w-[360px] max-w-[80%] md:w-[400px] lg:w-[450px] h-full">
    <div class="flex-1 overflow-hidden pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <component :is="currentComponent" :buttonShow="true" v-if="currentComponent" />
    </div>
  </van-popup>
</template>

<style scoped>
.mobile-side-panel-popup {
  padding: 0;
}

:deep(.van-popup__overlay) {
  background-color: transparent !important;
}
</style>
