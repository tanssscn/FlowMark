<script setup lang="ts">
import { useTabStore } from '@/stores/tabStore'
import type { OutlineItem } from '@/types/appTypes'
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { milkdownManager } from "@/services/milkdownManager";
import { Expand, Fold } from '@element-plus/icons-vue'

const tabStore = useTabStore()

const { t } = useI18n()

const expandedKeys = ref<string[]>([])

const treeProps = {
  label: 'text',
  children: 'children'
}
const outline = computed(() => {
  const tab = tabStore.state
  if (tab?.id === tabStore.outline.tabId) {
    return tabStore.outline.outline
  }
  return []
})
const handleNodeClick = (data: OutlineItem) => {
  milkdownManager.scrollTo(data.id)
}
const expandAll = () => {
  expandedKeys.value = getAllIdsReduce(outline.value as any[])
}
/**
 * 收集所有节点 ID，包括子节点 ID
 * @param nodes 
 */
const getAllIdsReduce = (nodes: any[]): string[] =>
  nodes.reduce((acc: string[], node) => {
    return [...acc, node.id, ...(node.children ? getAllIdsReduce(node.children) : [])];
  }, []);
// const collapseAll = () => {
//   console.log(expandedKeys.value)
//   expandedKeys.value = []
// }
const buttons = computed(() => [
  {
    label: t('outline.expandAll'),
    icon: Expand,
    click: expandAll,
  },
  // {
  //   label: t('outline.collapseAll'),
  //   icon: Fold,
  //   click: collapseAll,
  // },
])
</script>

<template>
  <SidePanelHeader v-bind="$attrs" :title="t('outline.label')" :buttons="buttons" />
  <div class="h-full ">
    <el-scrollbar v-if="outline.length > 0" class="flex-1 h-full">
      <el-tree :data="outline" :props="treeProps" :expand-on-click-node="false" :default-expanded-keys="expandedKeys"
        :default-expand-all="true" node-key="id" @node-click="handleNodeClick" class="h-full">
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
