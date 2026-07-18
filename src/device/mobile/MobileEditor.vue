<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import MainArea from '@/components/MainArea.vue'
import { useMobileNav } from './composable/useMobileNav'
import { useTabStore } from '@/stores/tabStore'
import { useWindowStore } from '@/stores/windowStore'

const { t } = useI18n()
const { navigateBack, togglePanel } = useMobileNav()
const tabStore = useTabStore()
const windowStore = useWindowStore()

const title = computed(() => tabStore.state?.title || t('app.title'))

const moreVisible = ref(false)
const moreActions = [
  { name: t('menu.FileMenu.exportPdf'), action: 'export-pdf' },
  { name: t('menu.FileMenu.exportHtml'), action: 'export-html' },
  { name: t('menu.EditMenu.find'), action: 'find' },
  { name: t('menu.EditMenu.replace'), action: 'replace' },
  { name: t('version.label'), action: 'version' },
]

function handleMoreAction(action: { name: string; action: string }) {
  moreVisible.value = false
  switch (action.action) {
    case 'find':
      windowStore.setFindReplace({ show: true, showReplace: false })
      break
    case 'replace':
      windowStore.setFindReplace({ show: true, showReplace: true })
      break
    case 'export-pdf':
      window.print()
      break
    case 'export-html':
      window.print()
      break
    case 'version':
      togglePanel('version')
      break
  }
}
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- 顶部导航栏（固定在顶部） -->
    <van-nav-bar :title="title" left-arrow :border="false" safe-area-inset-top fixed placeholder
      @click-left="navigateBack">
      <template #right>
        <div class="flex items-center gap-1">
          <van-icon name="orders-o" size="20" class="p-2 cursor-pointer" @click="togglePanel('outline')" />
          <van-icon name="more-o" size="20" class="p-2 cursor-pointer" @click="moreVisible = true" />
        </div>
      </template>
    </van-nav-bar>

    <!-- 编辑区 -->
    <div class="flex-1 overflow-hidden pb-[env(safe-area-inset-bottom)]">
      <MainArea />
    </div>

    <!-- 更多操作菜单 -->
    <van-action-sheet v-model:show="moreVisible" :actions="moreActions" :cancel-text="t('common.cancel')"
      @select="handleMoreAction" />
  </div>
</template>
