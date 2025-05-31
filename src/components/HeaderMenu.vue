<script setup lang="ts">
import { useWindowStore } from '@/stores/windowStore';
import AppMenu from './header/AppMenu.vue';
import {Setting} from '@element-plus/icons-vue'
const windowStore = useWindowStore()

</script>

<template>
  <header class="flex items-center justify-between px-4">
    <div class="flex-1 min-w-0">
      <app-menu />
    </div>
    <el-button link size="large" @click="windowStore.switchSettingsModal(true)" :icon="Setting" />
  </header>
</template>