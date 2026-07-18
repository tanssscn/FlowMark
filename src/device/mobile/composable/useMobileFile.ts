import { ref, computed } from 'vue'
import { useFileStore } from '@/stores/fileTreeStore'
import { useTabStore } from '@/stores/tabStore'
import { localFileService } from '@/services/files/local/localFileService'
import { dialogService } from '@/services/dialog/dialogService'
import type { FileEntry } from '@/types/appTypes'
import i18n from '@/i18n';
const { t } = i18n.global
/**
 * 移动端文件管理 composable
 * 核心理念：不管理文件夹，只管理用户主动添加的单个文件
 */
export function useMobileFile() {
  const fileStore = useFileStore()
  const tabStore = useTabStore()

  // 选择模式状态
  const isSelectMode = ref(false)
  const selectedPaths = ref<Set<string>>(new Set())

  // 移动端文件列表：只显示根节点中非目录的文件
  const mobileFiles = computed<FileEntry[]>(() => {
    return fileStore.fileTree.filter(entry => !entry.isDir)
  })

  // 选中的文件数量
  const selectedCount = computed(() => selectedPaths.value.size)

  // 是否全选
  const isAllSelected = computed(() =>
    mobileFiles.value.length > 0 &&
    mobileFiles.value.every(f => selectedPaths.value.has(f.path))
  )

  /**
   * 打开文件选择器，添加文件到列表
   */
  async function addFiles() {
    try {
      const result = await localFileService.openLocalFiles({
        title: t('fileTree.openFile'),
        filters: [
          { name: 'Markdown', extensions: ['md', 'markdown'] },
          { name: 'PDF', extensions: ['pdf'] },
          { name: 'Image', extensions: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      })

      if (!result) return

      let addedCount = 0

      for (const fileEntry of result) {
        const existing = fileStore.get(fileEntry.path)
        if (existing) {
          continue
        }
        fileStore.loadFileTree(fileEntry)
        addedCount++
      }

      if (addedCount === 0) {
        dialogService.warning(t('notify.errors.fileExists'))
      } else if (addedCount === result.length) {
        dialogService.success(t('notify.success.label'))
      } else {
        dialogService.success(t('mobile.fileTree.addedPartial', { count: addedCount }))
      }
    } catch (error) {
      console.error('添加文件失败:', error)
      dialogService.error(t('notify.errors.createFailed'))
    }
  }

  /**
   * 打开文件进入编辑器
   */
  function openFile(filePath: string) {
    tabStore.openInTab({ filePath })
  }

  /**
   * 从文件树移除文件（不删除实际文件）
   */
  function removeFromTree(filePath: string) {
    fileStore.removeRoot(filePath)
    selectedPaths.value.delete(filePath)
  }

  /**
   * 删除单个文件（从设备删除）
   */
  async function deleteFile(fileEntry: FileEntry) {
    await performDelete(fileEntry.path)
  }

  /**
   * 执行文件删除操作（内部方法）
   */
  async function performDelete(filePath: string) {
    try {
      await localFileService.delete({ path: filePath, isDir: false })
      removeFromTree(filePath)
      if (tabStore.state?.filePath === filePath) {
        tabStore.closeTab()
      }
      return true
    } catch (error) {
      console.error(`删除文件失败: ${filePath}`, error)
      return false
    }
  }

  /**
   * 进入/退出选择模式
   */
  function toggleSelectMode() {
    isSelectMode.value = !isSelectMode.value
    if (!isSelectMode.value) {
      selectedPaths.value.clear()
    }
  }

  /**
   * 切换文件选中状态
   */
  function toggleSelect(filePath: string) {
    if (selectedPaths.value.has(filePath)) {
      selectedPaths.value.delete(filePath)
    } else {
      selectedPaths.value.add(filePath)
    }
  }

  /**
   * 全选/取消全选
   */
  function toggleSelectAll() {
    if (isAllSelected.value) {
      selectedPaths.value.clear()
    } else {
      mobileFiles.value.forEach(f => selectedPaths.value.add(f.path))
    }
  }

  /**
   * 批量移除（从文件树移除，不删除文件）
   */
  async function batchRemove() {
    const count = selectedPaths.value.size
    if (count === 0) return
    const confirmed = await dialogService.confirm({
      title: t('mobile.fileTree.removeTitle'),
      message: t('mobile.fileTree.removeConfirm', { count }),
    })
    if (confirmed) {
      selectedPaths.value.forEach(path => fileStore.removeRoot(path))
      selectedPaths.value.clear()
      isSelectMode.value = false
      dialogService.success(t('notify.success.label'))
    }
  }

  /**
   * 批量删除（从设备删除文件）
   */
  async function batchDelete() {
    const count = selectedPaths.value.size
    if (count === 0) return
    const confirmed = await dialogService.confirm({
      title: t('mobile.fileTree.deleteTitle'),
      message: t('mobile.fileTree.deleteConfirm', { count }),
      type: 'warning',
    })
    if (confirmed) {
      const paths = Array.from(selectedPaths.value)
      let successCount = 0
      for (const path of paths) {
        if (await performDelete(path)) {
          successCount++
        }
      }
      selectedPaths.value.clear()
      isSelectMode.value = false
      if (successCount === 0) {
        dialogService.error(t('notify.errors.unknownError'))
      } else if (successCount === paths.length) {
        dialogService.success(t('notify.success.deleteFile'))
      } else {
        dialogService.warning(t('mobile.fileTree.deletePartial', { count: successCount }))
      }
    }
  }

  /**
   * 复制文件路径到剪贴板
   */
  async function copyPath(filePath: string) {
    try {
      await navigator.clipboard.writeText(filePath)
      dialogService.success(t('mobile.fileTree.pathCopied'))
    } catch (error) {
      console.error('复制路径失败:', error)
    }
  }

  /**
   * 在文件管理器中显示
   */
  async function revealInFinder(filePath: string) {
    try {
      await localFileService.openPathInFinder(filePath)
    } catch (error) {
      console.error('打开文件管理器失败:', error)
    }
  }

  return {
    mobileFiles,
    isSelectMode,
    selectedPaths,
    selectedCount,
    isAllSelected,
    addFiles,
    openFile,
    removeFromTree,
    deleteFile,
    toggleSelectMode,
    toggleSelect,
    toggleSelectAll,
    batchRemove,
    batchDelete,
    copyPath,
    revealInFinder,
  }
}
