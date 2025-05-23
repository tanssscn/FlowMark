import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AppFileInfo, RecentFile } from '@/types/app-types.ts'

export const useRecentStore = defineStore('recent', () => {
  const recentFiles = ref<RecentFile[]>([])
  const maxRecentFiles = 10
  // 添加最近文件
  function addRecentFile(fileInfo: Pick<AppFileInfo, 'path' | 'storageLocation' | 'isDir'>) {
    const existingIndex = recentFiles.value.findIndex(f => f.path === fileInfo.path)
    if (existingIndex >= 0) {
      // 更新现有记录
      recentFiles.value[existingIndex].lastOpened = Date.now()
    } else {
      // 添加新记录
      recentFiles.value.unshift({
        path: fileInfo.path,
        storageLocation: fileInfo.storageLocation,
        isDir: fileInfo.isDir,
        lastOpened: Date.now(),
        pinned: false
      })

      // 保持最大数量
      if (recentFiles.value.length > maxRecentFiles) {
        recentFiles.value = recentFiles.value.filter(f => f.pinned) // 保留固定的
          .concat(recentFiles.value.filter(f => !f.pinned) // 未固定的按时间排序
            .sort((a, b) => b.lastOpened - a.lastOpened)
            .slice(0, maxRecentFiles))
      }
    }
  }

  // 切换固定状态
  function togglePin(path: string) {
    const file = recentFiles.value.find(f => f.path === path)
    if (file) {
      file.pinned = !file.pinned
    }
  }
  function clearAll() {
    recentFiles.value.splice(0, recentFiles.value.length)
  }
  // 移除最近文件
  function removeRecentFile(path: string) {
    recentFiles.value = recentFiles.value.filter(f => f.path !== path)
  }

  // 获取排序后的列表（固定的在前，按时间排序）
  const sortedRecentFiles = computed(() => {
    return [...recentFiles.value]
      .sort((a, b) => {
        if (a.pinned && !b.pinned) return -1
        if (!a.pinned && b.pinned) return 1
        return b.lastOpened - a.lastOpened
      })
  })

  return {
    // 只读也会限制持久化赋值到变量，不会限制响应式
    state: sortedRecentFiles,
    recentFiles,
    addRecentFile,
    togglePin,
    removeRecentFile,
    clearAll
  }
}, {
  persist: {
    storage: localStorage,
    serializer: {
      serialize: (state) => {
        return JSON.stringify({ recentFiles: state.recentFiles })
      },
      deserialize: (saved) => {
        // 反序列化时，直接赋值给 `recentFiles`（不修改 `state`）
        const parsed = JSON.parse(saved)
        return { recentFiles: parsed.recentFiles }
      },
    },
  }
})