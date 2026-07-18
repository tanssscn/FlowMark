<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import { getDeviceInfo } from '@/services/deviceService'

const { isMobile } = getDeviceInfo()

const DesktopApp = defineAsyncComponent(() => import('@/device/desktop/DesktopApp.vue'))
const MobileApp = defineAsyncComponent(() => import('@/device/mobile/MobileApp.vue'))
</script>

<template>
  <MobileApp v-if="isMobile" />
  <DesktopApp v-else />
</template>

<style>
html,
body,
#app {
  height: 100%;
  margin: 0;
  padding: 0;
}
</style>
