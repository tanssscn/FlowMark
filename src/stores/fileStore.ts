import { defineStore } from 'pinia';
import type { FileSystemState, FileEntry } from '@/types/app-types.ts';
import { computed, reactive, readonly } from 'vue';
import { restoreApp, RestoreApp } from '@/services/persistService';


export const useFileStore = defineStore('file', () => {
  const fileState = reactive<FileSystemState>({
    expandedPaths: [],
    fileTree: new Map<string, FileEntry>(),
    treeRoot: {},
    loading: false,
  });
  const fileTree = computed((): FileEntry[] => {
    const getFileTree = (fileItem: FileEntry[]): FileEntry[] => {
      return fileItem.map(item => {
        const fileEntry = fileState.fileTree.get(item.path)
        if (fileEntry) {
          const children = getFileTree(fileEntry?.children ?? [])
          fileEntry.children = children
          return fileEntry
        }
      }).filter(item => item !== undefined)
    }
    return getFileTree(Object.values(fileState.treeRoot))
  });

  const set = (fileEntry: Array<FileEntry>) => {
    fileEntry.forEach(item => {
      fileState.fileTree.set(item.path, item)
      set(item?.children ?? [])
    })
  }
  const get = (path: string): FileEntry | undefined => {
    return fileState.fileTree.get(path)
  }
  const deleteFile = (path: string) => {
    const fileEntry = fileState.fileTree.get(path)
    if (fileEntry) {
      fileState.fileTree.delete(path)
      fileEntry.children?.map(child => deleteFile(child.path))
    }
  }
  // 封装文件操作
  const actions = {
    async withAutoLoading<T>(asyncFunc: () => Promise<T>) {
      fileState.loading = true
      try {
        const result = await asyncFunc()
        return result
      } catch (error) {
        throw error
      } finally {
        fileState.loading = false
      }
    },
    /**
     * 加载文件树（确保路径唯一性）
     * @param fileEntry 要加载的文件树根节点
     * @returns 是否成功加载
     */
    loadFileTree(fileEntry: FileEntry) {
      if (fileState.fileTree.get(fileEntry.path)) {
        // 如果路径已存在则直接返回
        return false;
      }
      // 检查路径冲突：如果新加载的树包含现有根路径，替换掉现有树
      // 现有/root/a/b/c    
      // 新要加载的/root/a/b（包含现有路径
      const conflictingRootIndex = fileTree.value.findIndex(
        root => root.path.startsWith(fileEntry.path)
      );
      fileEntry.isRoot = true;
      fileEntry.name += `(${fileEntry.path})`
      if (conflictingRootIndex < 0) {
        fileState.treeRoot[fileEntry.path] = fileEntry;
      }
      set([fileEntry])
      return true;
    },
    refresh(fileEntry: FileEntry) {
      if (fileState.treeRoot[fileEntry.path]) {
        fileEntry.isRoot = true;
        fileEntry.name += `(${fileEntry.path})`
      }
      deleteFile(fileEntry.path)
      set([fileEntry])
    },
    toggleExpand(path: string) {
      const index = fileState.expandedPaths.indexOf(path);
      if (index >= 0) {
        fileState.expandedPaths.splice(index, 1);
      } else {
        fileState.expandedPaths.push(path);
      }
    },
    /**
     * 
     * @param path 
     * @returns 返回删除的所有文件节点
     */
    removeRoot(path: string): FileEntry | undefined {
      delete fileState.treeRoot[path]
      const fileEntry = fileState.fileTree.get(path)
      deleteFile(path)
      return fileEntry
    },
  };
  return {
    state: readonly(fileState),
    fileTree,
    fileState,
    ...actions,
    get,
    set
  };
}, {
  persist: {
    omit: ["fileState.fileTree"],
    beforeHydrate: (ctx) => {
      restoreApp.restoreLastSession(undefined, () => {
        ctx.store.$state = {} // 清空恢复的数据
      })
    },
    storage: {
      getItem: (key) => {
        // 条件判断：例如仅允许特定环境读取
        return new RestoreApp().restoreLastSession(() => {
          return localStorage.getItem(key)
        }).getResult()
      },
      setItem: (key, value) => {
        // 条件判断：例如仅允许特定环境存储
        return restoreApp.restoreLastSession(() => {
          localStorage.setItem(key, value)
        })
      },
    },
    serializer: {
      serialize: (state) => {
        return JSON.stringify({
          fileState: state.fileState
        })
      },
      deserialize: (saved) => {
        const parsed = JSON.parse(saved)
        return { fileState: parsed.fileState }
      },
    }
  }
});