<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GeneralTab from './GeneralTab.vue'
import EditorTab from './EditorTab.vue'
import MarkdownTab from './MarkdownTab.vue'
import WebDAVTab from './WebDAVTab.vue'
import ViewTab from './appearance.vue'
import FileTab from './FileTab.vue'

const { t } = useI18n()
const activeTab = ref('general')

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
  <el-dialog show-close append-to-body width="600">
    <template #header>
      <div class="flex justify-between items-center py-2">
        <h2 class="text-xl font-medium m-0">{{ t('settings.label') }}</h2>
      </div>
    </template>

    <div class="flex overflow-hidden">
      <div class="settings-sidebar overflow-y-auto p-2">
        <el-menu :default-active="activeTab" class="h-full border-0 bg-transparent"
          @select="(key: string) => activeTab = key">
          <el-menu-item v-for="tab in tabs" :key="tab.id" :index="tab.id"
            class="mb-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
            {{ tab.label }}
          </el-menu-item>
        </el-menu>
      </div>
      <div class="flex-1 overflow-y-auto !p-2">
        <component :is="tabs.find(t => t.id === activeTab)?.component" />
      </div>
    </div>
  </el-dialog>
</template>