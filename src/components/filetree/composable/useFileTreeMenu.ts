import { useEdit } from '@/composable/useEdit';
import { useFileTree } from '@/composable/useFileTree';
import { CodeError } from '@/services/codeService';
import { fileService } from '@/services/files/fileService';
import { useFileStore } from '@/stores/fileStore';
import type { AppFileInfo, FileEntry } from '@/types/appTypes';
import { isEqualStatusCode, statusCode } from '@/utils/statusCodes';
import { nextTick } from 'vue';
import type Node from 'element-plus/es/components/tree/src/model/node'
import type {
  AllowDropType,
  NodeDropType,
} from 'element-plus/es/components/tree/src/tree.type'
import type { DragEvents } from 'element-plus/es/components/tree/src/model/useDragNode'
import { dialogService } from '@/services/dialog/dialogService';
import i18n from '@/i18n';
import { getDirname, getFilename, getJoin, isRelativePath, isValidFilePath } from '@/utils/pathUtil';
import { join, normalizeString } from 'pathe';
const { t } = i18n.global

export interface ContextMenuState {
  visible: boolean
  x: number
  y: number
  node: any
  data: FileEntry | null
}
export interface RenameState {
  isRenaming: boolean
  node: any
  data: FileEntry | null
  inputValue: string
  errors: {
    status: boolean
    message: string
  }
}
export interface DragState {
  draggingNode: any
  dropNode: any
  dropType: string
}
export interface TreeProps {
  label: string
  children: string
  isLeaf: (data: FileEntry) => boolean
}
/**
 * 文件树操作相关
 * 
 */
export function fileTree(renameState: RenameState, contextMenu: ContextMenuState,
  dragState: DragState, treeProps: TreeProps) {
  const { openFileOnTab } = useEdit()
  const fileStore = useFileStore()
  const { move, rename, refresh } = useFileTree()

  // 处理节点点击
  const handleNodeClick = (data: FileEntry) => {
    if (!data.isDir) {
      openFileOnTab(data)
    }
  }
  const toggleExpand = (data: FileEntry, node: any, component: any) => {
    fileStore.toggleExpand(data.path)
  }
  // 右键菜单处理
  const showContextMenu = (event: MouseEvent, data: FileEntry, node: any, component: any) => {
    // reactive 不能直接修改，需要单个修改
    event.preventDefault()
    contextMenu.visible = true
    contextMenu.x = event.clientX
    contextMenu.y = event.clientY
    contextMenu.node = node
    contextMenu.data = data
  }

  /**
   * 
   * @param draggingNode 
   * @param dropNode 
   * @param type 参数有三种情况：'prev'、'inner' 和 'next'，分别表示放置在目标节点前、插入至目标节点和放置在目标节点后
   * @returns 
   */
  const allowDrop = (draggingNode: Node, dropNode: Node, type: AllowDropType) => {
    // 如果是文件，则不能放在文件内部
    if (!dropNode.data.isDir && type == 'inner') return false
    // 如果目标节点是根目录，则只能放置在inner
    if (dropNode.data.isRoot && type !== 'inner') return false
    return true
  }


  const handleDragStart = (node: any) => {
    dragState.draggingNode = node
  }

  const handleDragEnd = () => {
    dragState = {
      draggingNode: null,
      dropNode: null,
      dropType: ''
    }
  }

  const handleDragOver = (draggingNode: any, dropNode: any, evt: DragEvent, event: DragEvents) => {
    dragState.draggingNode = draggingNode
    dragState.dropNode = dropNode
    dragState.dropType = ''
  }

  /**
   * 拖拽移动文件功能
   * @param draggingNode 
   * @param dropNode 
   * @param type 
   */
  const handleDrop = async (draggingNode: Node, dropNode: Node, type: AllowDropType, event: DragEvent) => {
    console.log('drop', draggingNode, dropNode, type)
    try {
      let targetPath = dropNode.data.path
      if (type === 'inner') {
        // 拖拽到目录内
        targetPath = `${targetPath}/${draggingNode.data.name}`
      } else {
        // 拖拽到同级
        const dirPath = targetPath.substring(0, targetPath.lastIndexOf('/') + 1)
        targetPath = `${dirPath}${draggingNode.data.name}`
      }

      await move({ path: draggingNode.data.path, storageLocation: draggingNode.data.storageLocation, isDir: draggingNode.data.isDir },
        { path: targetPath, storageLocation: dropNode.data.storageLocation })
      event.preventDefault() // 阻止默认行为
    } catch (error) {
      console.error('文件移动失败:', error)
    }
  }

  // 开始重命名
  const startRename = (data: FileEntry) => {
    // reactive 不能直接修改，需要单个修改
    renameState.isRenaming = true
    renameState.node = null
    renameState.data = data
    renameState.inputValue = data.name
    renameState.errors.status = false
    renameState.errors.message = ''

    contextMenu.visible = false

    // 在下一个 tick 中聚焦输入框
    nextTick(() => {
      const input = document.getElementsByName('renameInput')[0] as HTMLInputElement
      if (input) {
        input.focus()
        input.select()
      }
    })
  }
  // 取消重命名
  const cancelRename = () => {
    renameState.isRenaming = false
  }
  // 完成重命名
  async function finishRename() {
    if (!renameState.data) return

    const newName = renameState.inputValue.trim()
    if (newName && newName !== renameState.data.name) {
      try {
        await rename(renameState.data, newName)
      } catch (error) {
        if (isEqualStatusCode(error, statusCode.FILE_EXITS)) {
          renameState.errors.status = true
          renameState.errors.message = statusCode.FILE_EXITS.message
          return
        }
      }
    } renameState.errors.status = false
    renameState.errors.message = ''
    renameState.isRenaming = false
  }
  // 创建新文件/文件夹并立即进入重命名状态
  const create = async (node: any, data: FileEntry, isDirectory: boolean) => {
    const newName = await dialogService.prompt({
      title: isDirectory ? t('dialog.createFolder.title') : t('dialog.createFile.title'),
      message: isDirectory ? t('dialog.createFolder.message') : t('dialog.createFile.message'),
      inputValidator: (value) => {
        if (!value) {
          return t('notify.errors.nameCannotBeEmpty')
        }
        if (isValidFilePath(value)) {
          const path = getJoin(data.path, normalizeString(value, false))
          if (fileStore.get(path)) {
            return t('notify.errors.fileExists')
          } else {
            value = path;
            return true
          }
        }
        return t('notify.errors.nameInvalid');
      }
    })
    if (!newName) return
    const newPath = getJoin(data.path, normalizeString(newName, false))
    const parentPath = getDirname(newPath)
    if (!fileStore.get(parentPath)) {
      await fileService.create({
        path: getDirname(newPath),
        storageLocation: data.storageLocation,
        isDir: true
      }, true).catch((error) => {
        dialogService.error(
          error,
          t('notify.errors.createFailed')
        )
      })
    }
    // 创建新文件/文件夹
    const newEntry = {
      name: getFilename(newPath),
      path: newPath,
      storageLocation: data.storageLocation,
      isDir: isDirectory,
      children: isDirectory ? [] : undefined,
    } as FileEntry
    fileService.create(newEntry).then(() => {
      // 展开父节点（如果是文件夹）
      if (isDirectory) {
        node.expanded = true
      }
      console.log('create', data)
      refresh(data, false)
    }).catch((error) => {
      dialogService.error(
        error,
        t('notify.errors.createFailed')
      )
    })
  }

  return {
    handleNodeClick,
    toggleExpand,
    showContextMenu,
    allowDrop,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDrop,
    startRename,
    cancelRename,
    finishRename,
    create
  };
}
