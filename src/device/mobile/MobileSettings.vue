<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GeneralTab from '@/components/settings/GeneralTab.vue'
import EditorTab from '@/components/settings/EditorTab.vue'
import MarkdownTab from '@/components/settings/MarkdownTab.vue'
import WebDAVTab from '@/components/settings/WebDAVTab.vue'
import ViewTab from '@/components/settings/appearance.vue'
import FileTab from '@/components/settings/FileTab.vue'
import UpdateTab from '@/components/settings/UpdateTab.vue'
import { useMobileNav } from './composable/useMobileNav'

const { t } = useI18n()
const { navigateBack } = useMobileNav()
const activeTab = ref(0)

const tabs = computed(() => [
  { id: 'general', label: t('settings.general.label'), component: GeneralTab },
  { id: 'view', label: t('settings.appearance.label'), component: ViewTab },
  { id: 'file', label: t('settings.file.label'), component: FileTab },
  { id: 'editor', label: t('settings.editor.label'), component: EditorTab },
  { id: 'markdown', label: t('settings.markdown.label'), component: MarkdownTab },
  { id: 'webdav', label: t('settings.webdav.label'), component: WebDAVTab },
])
</script>

<template>
  <div class="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
    <!-- 导航栏 -->
    <van-nav-bar :title="t('settings.label')" left-arrow :border="false" safe-area-inset-top
      @click-left="navigateBack" />

    <!-- Tabs + 内容 -->
    <van-tabs v-model:active="activeTab" swipeable animated class="flex-1 overflow-hidden">
      <van-tab v-for="(tab, index) in tabs" :key="tab.id" :title="tab.label" :name="index">
        <div class="p-3 pb-[calc(12px+env(safe-area-inset-bottom))] min-h-[calc(100vh-200px)]">
          <component :is="tab.component" />
        </div>
      </van-tab>
    </van-tabs>
  </div>
</template>
