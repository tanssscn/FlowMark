<script setup lang="ts">
import { ref } from 'vue'
import { useSettingsStore } from '@/stores/settingsStore'
const  emit = defineEmits(['close'])
const settingsStore = useSettingsStore()
const activeTab = ref('general')

const tabs = [
  { id: 'general', label: '通用' },
  { id: 'editor', label: '编辑器' },
  { id: 'markdown', label: 'Markdown' },
  { id: 'webdav', label: 'WebDAV' }
]

const closeModal = () => {
  emit('close')
}
</script>

<template>
  <div class="fixed inset-0 flex items-center justify-center z-[1000]">
    <div class="absolute inset-0" @click="closeModal"></div>

    <div class="relative w-[800px] max-w-[90vw] max-h-[80vh] flex-col overflow-hidden border flex justify-between items-center">
        <h3 class="text-lg font-semibold">设置</h3>
        <button class="bg-transparent border-none text-2xl cursor-pointer p-0 px-2" @click="closeModal">×</button>
      </div>

      <div class="flex flex-1 overflow-hidden">
        <div class="w-40 border-r py-2">
          <button v-for="tab in tabs" :key="tab.id" 
                  class="w-full py-2 px-4 text-left border-none cursor-pointer': activeTab !== tab.id }"
                  @click="activeTab = tab.id">
            {{ tab.label }}
          </button>
        </div>

        <div class="flex-1 p-4 overflow-y-auto">
          <GeneralSettings v-if="activeTab === 'general'" />
          <EditorSettings v-if="activeTab === 'editor'" />
          <MarkdownSettings v-if="activeTab === 'markdown'" />
          <WebDAVSettings v-if="activeTab === 'webdav'" />
        </div>
      </div>

      <div class="p-3 border-tflex justify-end gap-2">
        <button class="px-4 py-2border 
                    rounded-md cursor-pointer" @click="closeModal">取消</button>
        <button class="px-4 py-2 border-none rounded-md cursor-pointer" @click="">确定</button>
      </div>
    </div>
</template>