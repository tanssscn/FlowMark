<script setup lang="ts">
import { useEdit } from '@/composable/useEdit'
import { useFileTree } from '@/composable/useFileTree'
import { AppFileInfo, FileEntry } from '@/types/appTypes'
import { FolderOpened, InfoFilled, Remove, FolderAdd, Document, DocumentAdd, Delete, Edit } from '@element-plus/icons-vue'
import { ContextMenuState } from './composable/useFileTreeMenu'
import { localFileService } from '@/services/files/local/localFileService'
import { getDeviceInfo } from '@/services/deviceService'
import { dialogService } from '@/services/dialog/dialogService'
import { computed, ref } from 'vue'
import { onClickOutside } from '@vueuse/core'
import { useI18n } from 'vue-i18n'
const isBrowser = getDeviceInfo().isBrowser;
const { openFileOnTab } = useEdit()
const { t } = useI18n()

const { remove, removeFromTree, refresh } = useFileTree()
const props = defineProps<{
  contextMenu: ContextMenuState
}>()
const emit = defineEmits(['rename', 'showProperties', 'newFile', 'newFolder', 'close'])
// 右键菜单操作
// 处理菜单项点击
const handleContextAction = async (index: string) => {
  const data = props.contextMenu.data
  if (data) {
    const menuItem = menuItems.value.find((item: MenuItem) => item.id === index)
    if (menuItem) {
      await menuItem.action(data)
    }
  }
  emit('close')
}
interface MenuItem {
  id: string;
  label: string;
  icon: any;
  visible: (data: FileEntry | null) => boolean;
  action: (data: FileEntry) => void;
}
// 定义菜单项配置
const menuItems = computed((): MenuItem[] => [
  {
    id: 'open',
    label: t('fileTree.open'),
    icon: Document,
    visible: (data: FileEntry | null) => !data?.isDir,
    action: (data: FileEntry) => openFileOnTab(data)
  },
  {
    id: 'openInNewTab',
    label: t('fileTree.openInNewTab'),
    icon: FolderAdd,
    visible: (data: FileEntry | null) => !data?.isDir,
    action: (data: FileEntry) => openFileOnTab(data, { tabBehavior: 'new_tab' })
  },
  {
    id: 'revealInExplorer',
    label: t('fileTree.revealInExplorer'),
    icon: FolderOpened,
    // 只能是本地平台（除了浏览器）
    visible: (data: FileEntry | null) => data?.storageLocation === 'local' && (!isBrowser),
    action: (data: FileEntry) => localFileService.openPathInFinder(data.path)
  },
  {
    id: 'showProperties',
    label: t('fileTree.properties'),
    icon: InfoFilled,
    visible: () => true,
    action: (data: FileEntry) => emit('showProperties', data)
  },
  {
    id: 'refresh',
    label: t('fileTree.refresh'),
    icon: FolderAdd,
    visible: (data: FileEntry | null) =>
      data?.isDir! && !(data.storageLocation === 'local' && isBrowser),
    action: (data: FileEntry) => refresh(data, false)
  },
  {
    id: 'newFile',
    label: t('fileTree.newFile'),
    icon: DocumentAdd,
    // 点击文件夹（除了浏览器平台的本地文件夹）
    visible: (data: FileEntry | null) =>
      data?.isDir! && !(data.storageLocation === 'local' && isBrowser),
    action: async (data: FileEntry) => {
      emit('newFile', props.contextMenu.node, data)
    }
  },
  {
    id: 'newFolder',
    label: t('fileTree.newFolder'),
    icon: FolderAdd,
    // 点击文件夹（除了浏览器平台的本地文件夹）
    visible: (data: FileEntry | null) =>
      data?.isDir! && !(data.storageLocation === 'local' && isBrowser),
    action: async (data: FileEntry) => {
      emit('newFolder', props.contextMenu.node, data)
    }
  },
  {
    id: 'rename',
    label: t('fileTree.rename'),
    icon: Edit,
    visible: (data: FileEntry | null) => !data?.isRoot,
    action: (data: FileEntry) => emit('rename', data)
  },
  {
    id: 'removeFromTree',
    label: t('fileTree.removeFromTree'),
    icon: Remove,
    // 点击根目录
    visible: (data: FileEntry | null) => data?.isRoot!,
    action: (data: FileEntry) => removeFromTree(data)
  },
  {
    id: 'delete',
    label: t('fileTree.delete'),
    icon: Delete,
    visible: () => true,
    action: async (data: FileEntry) => {
      dialogService.confirm({
        title: t('dialog.deleteFile.title'),
        message: t('dialog.deleteFile.message', {msg: data.name}),
        type: 'warning'
      }).then(async (confirm) => {
        if (confirm) {
          await remove(data)
        }
      })
    }
  }
])
const fileTreeMenuRef = ref<HTMLElement | null>(null)
const marginLeft = computed(() => `${props.contextMenu.x}px`)
const marginTop = computed((): string => {
  let y = props.contextMenu.y
  if (fileTreeMenuRef.value) {
    // BUG：点击文件树右边缘会导致fileTreeMenuRef.value.offsetHeight为0
    const componentHeight = Math.max(fileTreeMenuRef.value.offsetHeight, 200)
    if (props.contextMenu.y + componentHeight > window.innerHeight) {
      y = window.innerHeight - componentHeight
    }
  }
  return `${y}px`
})
// 监听菜单显示状态
onClickOutside(fileTreeMenuRef, event => emit('close'))

</script>
<template>
  <div class="file-tree-menu" ref="fileTreeMenuRef" v-show="contextMenu.visible">
    <div v-for="item in menuItems.filter(i => i.visible(contextMenu?.data))" :key="item.id">
      <el-button class="w-full justify-start!" text bg @click="handleContextAction(item.id)">
        <el-icon>
          <component :is="item.icon" />
        </el-icon>
        <span>{{ item.label }}</span>
      </el-button>
    </div>
  </div>
</template>
<style scoped>
/**
 append-to-body会影响css选择，scope更难选择到，
所以像dialog这种弹出层不用scope，直接写全局样式，自定class避免影响其他组件 
 */
.file-tree-menu {
  position: fixed;
  top: v-bind("marginTop");
  left: v-bind("marginLeft");
  z-index: 999;
}
</style>