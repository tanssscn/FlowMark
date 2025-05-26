<script setup lang="ts">
import { useTabStore } from '@/stores/tabStore'
import type { OutlineItem } from '@/types/appTypes'
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { milkdownManager } from "@/services/milkdownManager";

const tabStore = useTabStore()

const { t } = useI18n()

const allCollapsed = ref(false)
const expandedKeys = ref<string[]>([])

const treeProps = {
  label: 'text',
  children: 'children'
}
const outline = computed(() => {
  const tab = tabStore.activeTab
  if (tab?.id === tabStore.outline.tabId) {
    return tabStore.outline.outline
  }
  return []
})
const handleNodeClick = (data: OutlineItem) => {
  milkdownManager.scrollTo(data.id)
}

const toggleAllCollapse = () => {
  allCollapsed.value = !allCollapsed.value
  expandedKeys.value = allCollapsed.value ? [] :
    outline.value.filter(item => item.level <= 2)
      .map(item => item.id)
}
</script>

<template>
  <div class="h-full ">
    <el-scrollbar v-if="outline.length > 0" class="flex-1 h-full">
      <el-tree :data="outline" :props="treeProps" :expand-on-click-node="false" :default-expanded-keys="expandedKeys"
        node-key="id" @node-click="handleNodeClick">
        <template #default="{ node, data }">
          <div class="flex items-center w-full">
            <span class="truncate" :class="{
              'font-bold': data.level === 1,
              'font-semibold': data.level === 2,
              'font-medium': data.level === 3,
              'font-normal': data.level > 3,
            }" :style="{
              fontSize: `${Math.max(16 - data.level, 12)}px`
            }">
              {{ node.label }}
            </span>
          </div>
        </template>
      </el-tree>
    </el-scrollbar>
    <div v-else class="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm">
      <el-empty :description="t('outline.empty') || 'No headings found'" :image-size="80" />
    </div>
  </div>
</template>
