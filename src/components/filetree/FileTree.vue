<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useFileStore } from '@/stores/fileStore'
import type { FileEntry } from '@/types/app-types.ts'
import FileTreeMenu from './FileTreeMenu.vue'
import { FolderOpened, Folder, Document } from '@element-plus/icons-vue'
import { ContextMenuState, DragState, fileTree, RenameState, TreeProps } from './composable/useFileTreeMenu'
import { useTabStore } from '@/stores/tabStore';
import FilePropertiesPanel from './FileProperties.vue'

const fileStore = useFileStore()
const tabStore = useTabStore()


// Element Plus Tree 相关状态
const treeRef = ref()
const treeProps: TreeProps = {
  label: 'name',
  children: 'children',
  isLeaf: (data: FileEntry) => !data.isDir
}

// 重命名相关状态
const renameState = reactive<RenameState>({
  isRenaming: false,
  node: null as any,
  data: null as FileEntry | null,
  inputValue: '',
  errors: {
    status: false,
    message: ''
  }
})
// 右键菜单状态
const contextMenu = reactive<ContextMenuState>({
  visible: false,
  x: 0,
  y: 0,
  node: null as any,
  data: null as FileEntry | null
})

// 拖拽状态
const dragState = reactive<DragState>({
  draggingNode: null as any,
  dropNode: null as any,
  dropType: ''
})
const showPropertiesPanel = ref(false)
const propertiesFile = ref<FileEntry | null>(null)
const showProperties = (data: FileEntry) => {
  propertiesFile.value = data
  showPropertiesPanel.value = true
}
const allowDrag = (node: any) => {
  console.log(node)
  return !node.data.isRoot
}

const { handleNodeClick,
  toggleExpand,
  showContextMenu,
  allowDrop,
  handleDragStart,
  handleDragEnd,
  handleDragOver,
  handleDrop,
  startRename,
  cancelRename,
  finishRename, create } = fileTree(renameState, contextMenu, dragState, treeProps)
</script>

<template>
  <div>
    <el-button v-show="fileStore.state.loading" v-loading="true" link />
    <el-scrollbar class="h-full pr-3!">
      <el-tree ref="treeRef" :data="fileStore.fileTree" :props="treeProps" draggable :allow-drag="allowDrag"
        :allow-drop="allowDrop" :highlight-current="true" node-key="path" @node-click="handleNodeClick"
        @node-contextmenu="showContextMenu" @node-drag-start="handleDragStart" @node-drag-end="handleDragEnd"
        @node-drag-over="handleDragOver" :default-expanded-keys="fileStore.state.expandedPaths"
        @node-expand="toggleExpand" @node-collapse="toggleExpand" @node-drop="handleDrop"
        :current-node-key="tabStore.activeTab?.filePath" check-on-click-node>
        <template #default="{ node, data }">
          <div class="flex items-center w-full">
            <el-icon v-if="data.isDir" class="mr-2">
              <folder-opened v-if="node.expanded" />
              <folder v-else />
            </el-icon>
            <el-icon v-else class="mr-2 relative block">
              <document />
            </el-icon>
            <el-text class="w-[calc(100%-30px)]" v-if="!renameState.isRenaming || renameState.data?.path !== data.path"
              truncated>
              {{ node.label }}
            </el-text>
            <div class="z-10" v-else>
              <el-input v-model="renameState.inputValue" autofocus name="renameInput" @keyup.enter="finishRename"
                @keyup.esc="cancelRename" @blur="finishRename" ref="renameInput" size="small"
                :class="{ 'dark:bg-gray-800 bg-amber-50 ring-2 border-red-900 ring-red-900': renameState.errors.status }"
                class="w-full" />
              <div v-if="renameState.errors.status" class="bg-red-900 text-xs rounded-b"
                style="padding: 0.5rem 0.25rem 1em 0.25rem; ">
                {{ renameState.errors.message }}
              </div>
            </div>
          </div>
        </template>

      </el-tree>
    </el-scrollbar>
    <!-- 右键菜单 -->
    <!-- teleport 组件可以将组件渲染到 body 元素下，避免被组件内部的样式影响  -->
    <teleport to="body">
      <file-tree-menu :contextMenu="contextMenu" @rename="startRename" @show-properties="showProperties"
        @new-file="(node: Node, data: FileEntry) => create(node, data, false)"
        @new-folder="(node: Node, data: FileEntry) => create(node, data, true)" 
        @close="contextMenu.visible = false"/>
    </teleport>
      <FilePropertiesPanel v-model="showPropertiesPanel" :file="propertiesFile" @close="showPropertiesPanel = false"/>
  </div>
</template>
<style scoped>
/* 核心代码 */

:deep(.el-scrollbar__wrap) {
  overflow-x: hidden !important;
}

:deep(.el-scrollbar__bar.is-horizontal) {
  display: none !important;
}
</style>