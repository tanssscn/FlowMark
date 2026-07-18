<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import MobileFileTree from './MobileFileTree.vue'
import { useMobileNav } from './composable/useMobileNav'

const { t } = useI18n()
const { navigateTo } = useMobileNav()
</script>

<template>
  <div class="flex flex-col h-full bg-white dark:bg-gray-900">
    <!-- 顶部导航栏 -->
    <van-nav-bar
      :title="t('app.title')"
      :border="false"
      safe-area-inset-top
    >
      <template #right>
        <van-icon name="setting-o" size="22" class="text-gray-800 dark:text-gray-100" @click="navigateTo('settings')" />
      </template>
    </van-nav-bar>

    <!-- 移动端文件树 -->
    <MobileFileTree />
  </div>
</template>
