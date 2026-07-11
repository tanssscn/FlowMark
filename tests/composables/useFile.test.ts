import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0))
import { useFile } from '@/composable/useFile'

vi.mock('@/services/deviceService', () => ({
  getDeviceInfo: vi.fn().mockReturnValue({ isBrowser: false }),
}))

vi.mock('@/stores/fileTreeStore', () => ({
  useFileStore: vi.fn().mockReturnValue({
    loadFileTree: vi.fn(),
    get: vi.fn(),
    refresh: vi.fn(),
    removeRoot: vi.fn(),
    set: vi.fn(),
  }),
}))

vi.mock('@/stores/recentFileStore', () => ({
  useRecentStore: vi.fn().mockReturnValue({
    addRecentFile: vi.fn(),
    clearAll: vi.fn(),
  }),
}))

vi.mock('@/stores/tabStore', () => ({
  useTabStore: vi.fn().mockReturnValue({
    updatePath: vi.fn(),
  }),
}))

vi.mock('@/services/files/fileService', () => ({
  fileService: {
    readDirectory: vi.fn(),
    getStat: vi.fn(),
    exists: vi.fn(),
    rename: vi.fn(),
    delete: vi.fn(),
    create: vi.fn(),
    copyAcrossStorage: vi.fn(),
  },
}))

vi.mock('@/services/files/local/localFileService', () => ({
  localFileService: {
    openLocalFile: vi.fn(),
  },
}))

vi.mock('@/services/dialog/dialogService', () => ({
  dialogService: {
    notifyError: vi.fn(),
    confirm: vi.fn(),
  },
}))

vi.mock('@/services/codeService', () => ({
  ErrorStatus: class {
    code: number
    message: string
    detail?: string
    constructor(statusCode: any) {
      this.code = statusCode.code
      this.message = statusCode.message
      this.detail = statusCode.detail
    }
  },
}))

vi.mock('@/components/header/composable/client/tauriMenu', () => ({
  rebuildMenu: vi.fn(),
}))

vi.mock('@/i18n', () => ({
  default: {
    global: {
      t: (key: string) => key,
    },
  },
}))

import { useFileStore } from '@/stores/fileTreeStore'
import { useRecentStore } from '@/stores/recentFileStore'
import { useTabStore } from '@/stores/tabStore'
import { fileService } from '@/services/files/fileService'
import { localFileService } from '@/services/files/local/localFileService'
import { dialogService } from '@/services/dialog/dialogService'
import { ErrorStatus } from '@/services/codeService'

describe('useFile', () => {
  let fileStore: any
  let recentStore: any
  let tabStore: any

  beforeEach(() => {
    vi.clearAllMocks()
    fileStore = {
      loadFileTree: vi.fn(),
      get: vi.fn().mockReturnValue(null),
      refresh: vi.fn(),
      removeRoot: vi.fn().mockReturnValue(true),
      set: vi.fn(),
    }
    recentStore = {
      addRecentFile: vi.fn(),
      clearAll: vi.fn(),
    }
    tabStore = {
      updatePath: vi.fn(),
    }
    vi.mocked(useFileStore).mockReturnValue(fileStore)
    vi.mocked(useRecentStore).mockReturnValue(recentStore)
    vi.mocked(useTabStore).mockReturnValue(tabStore)
  })

  describe('openFolder', () => {
    it('should load file tree when folder is selected', async () => {
      const mockEntry = { path: '/test/folder', name: 'folder', isDir: true, storageLocation: 'local' }
      vi.mocked(localFileService.openLocalFile).mockResolvedValue(mockEntry)

      const { openFolder } = useFile()
      await openFolder()

      expect(fileStore.loadFileTree).toHaveBeenCalledWith(mockEntry)
      expect(recentStore.addRecentFile).toHaveBeenCalledWith(mockEntry)
    })

    it('should not load file tree when already exists', async () => {
      const mockEntry = { path: '/test/folder', name: 'folder', isDir: true, storageLocation: 'local' }
      vi.mocked(localFileService.openLocalFile).mockResolvedValue(mockEntry)
      fileStore.get = vi.fn().mockReturnValue(mockEntry)

      const { openFolder } = useFile()
      await openFolder()

      expect(fileStore.loadFileTree).not.toHaveBeenCalled()
    })

    it('should do nothing when cancelled', async () => {
      vi.mocked(localFileService.openLocalFile).mockResolvedValue(null)

      const { openFolder } = useFile()
      await openFolder()

      expect(fileStore.loadFileTree).not.toHaveBeenCalled()
    })
  })

  describe('openFile', () => {
    it('should load file tree when file is selected', async () => {
      const mockEntry = { path: '/test/file.md', name: 'file.md', isDir: false, storageLocation: 'local' }
      vi.mocked(localFileService.openLocalFile).mockResolvedValue(mockEntry)

      const { openFile } = useFile()
      await openFile()

      expect(fileStore.loadFileTree).toHaveBeenCalledWith(mockEntry)
    })
  })

  describe('openRecentFile', () => {
    it('should load file tree for directory', async () => {
      const mockFileInfo = { path: '/test/folder', isDir: true, storageLocation: 'local' }
      const mockEntry = { ...mockFileInfo, name: 'folder' }
      vi.mocked(fileService.readDirectory).mockResolvedValue(mockEntry)

      const { openRecentFile } = useFile()
      await openRecentFile(mockFileInfo)

      expect(fileService.readDirectory).toHaveBeenCalled()
      expect(fileStore.loadFileTree).toHaveBeenCalled()
    })

    it('should load file tree for file', async () => {
      const mockFileInfo = { path: '/test/file.md', isDir: false, storageLocation: 'local' }
      const mockEntry = { ...mockFileInfo, name: 'file.md' }
      vi.mocked(fileService.getStat).mockResolvedValue(mockEntry)

      const { openRecentFile } = useFile()
      await openRecentFile(mockFileInfo)

      expect(fileService.getStat).toHaveBeenCalled()
      expect(fileStore.loadFileTree).toHaveBeenCalled()
    })

    it('should not load when file already in tree', async () => {
      const mockFileInfo = { path: '/test/file.md', isDir: false, storageLocation: 'local' }
      fileStore.get = vi.fn().mockReturnValue(mockFileInfo)

      const { openRecentFile } = useFile()
      await openRecentFile(mockFileInfo)

      expect(fileService.readDirectory).not.toHaveBeenCalled()
      expect(fileService.getStat).not.toHaveBeenCalled()
    })

    it('should handle errors gracefully', async () => {
      const mockFileInfo = { path: '/test/file.md', isDir: false, storageLocation: 'local' }
      vi.mocked(fileService.getStat).mockRejectedValue(new ErrorStatus({ code: 4000, message: 'Error', detail: 'Detail' }))

      const { openRecentFile } = useFile()
      await openRecentFile(mockFileInfo)

      expect(dialogService.notifyError).toHaveBeenCalled()
    })
  })

  describe('refresh', () => {
    it('should refresh directory', async () => {
      const mockFileInfo = { path: '/test/folder', isDir: true, storageLocation: 'local' }
      const mockEntry = { ...mockFileInfo, name: 'folder' }
      vi.mocked(fileService.readDirectory).mockResolvedValue(mockEntry)

      const { refresh } = useFile()
      await refresh(mockFileInfo)

      expect(fileService.readDirectory).toHaveBeenCalled()
      expect(fileStore.refresh).toHaveBeenCalled()
    })

    it('should refresh file with parent directory', async () => {
      const mockFileInfo = { path: '/test/folder/file.md', isDir: false, storageLocation: 'local' }
      const mockEntry = { path: '/test/folder', name: 'folder', isDir: true, storageLocation: 'local' }
      vi.mocked(fileService.readDirectory).mockResolvedValue(mockEntry)

      const { refresh } = useFile()
      await refresh(mockFileInfo)

      expect(fileService.readDirectory).toHaveBeenCalledWith({ ...mockFileInfo, path: '/test/folder' })
    })

    it('should refresh file directly when useParentRefresh is false', async () => {
      const mockFileInfo = { path: '/test/file.md', isDir: false, storageLocation: 'local' }
      const mockEntry = { ...mockFileInfo, name: 'file.md' }
      vi.mocked(fileService.getStat).mockResolvedValue(mockEntry)

      const { refresh } = useFile()
      await refresh(mockFileInfo, false)

      expect(fileService.getStat).toHaveBeenCalled()
    })
  })

  describe('rename', () => {
    it('should rename file', async () => {
      const mockFileInfo = { path: '/test/old.md', name: 'old.md', isDir: false, storageLocation: 'local' }
      vi.mocked(fileService.exists).mockResolvedValue(false)

      const { rename } = useFile()
      await rename(mockFileInfo, 'new.md')

      expect(fileService.exists).toHaveBeenCalledWith(
        expect.objectContaining({ path: '/test/new.md', name: 'new.md' })
      )
      expect(fileService.rename).toHaveBeenCalledWith(mockFileInfo, '/test/new.md')
      expect(fileStore.refresh).toHaveBeenCalled()
      expect(tabStore.updatePath).toHaveBeenCalledWith('/test/old.md', '/test/new.md')
    })

    it('should throw error when file exists', async () => {
      const mockFileInfo = { path: '/test/old.md', name: 'old.md', isDir: false, storageLocation: 'local' }
      vi.mocked(fileService.exists).mockResolvedValue(true)

      const { rename } = useFile()
      await expect(rename(mockFileInfo, 'new.md')).rejects.toThrow()
      expect(fileService.rename).not.toHaveBeenCalled()
    })
  })

  describe('remove', () => {
    it('should remove file and refresh', async () => {
      const mockFileInfo = { path: '/test/file.md', name: 'file.md', isDir: false, storageLocation: 'local', isRoot: false }

      const { remove } = useFile()
      await remove(mockFileInfo)

      expect(fileService.delete).toHaveBeenCalledWith(mockFileInfo)
      expect(fileStore.refresh).toHaveBeenCalled()
      expect(tabStore.updatePath).toHaveBeenCalledWith('/test/file.md', null)
    })

    it('should remove root from tree', async () => {
      const mockFileInfo = { path: '/test/folder', name: 'folder', isDir: true, storageLocation: 'local', isRoot: true }

      const { remove } = useFile()
      await remove(mockFileInfo)

      expect(fileService.delete).toHaveBeenCalledWith(mockFileInfo)
      expect(fileStore.removeRoot).toHaveBeenCalled()
    })
  })

  describe('create', () => {
    it('should create file', async () => {
      const mockFileInfo = { path: '/test/new.md', isDir: false, storageLocation: 'local' }

      const { create } = useFile()
      await create(mockFileInfo)

      expect(fileService.create).toHaveBeenCalledWith(mockFileInfo)
      expect(fileStore.refresh).toHaveBeenCalled()
    })

    it('should create directory', async () => {
      const mockFileInfo = { path: '/test/newdir', isDir: true, storageLocation: 'local' }

      const { create } = useFile()
      await create(mockFileInfo)

      expect(fileService.create).toHaveBeenCalledWith(mockFileInfo)
    })
  })

  describe('move', () => {
    it('should move file', async () => {
      const oldFileInfo = { path: '/source/file.md', isDir: false, storageLocation: 'local' }
      const newFileInfo = { path: '/dest/file.md', storageLocation: 'local' }

      const { move } = useFile()
      await move(oldFileInfo, newFileInfo)

      expect(fileService.copyAcrossStorage).toHaveBeenCalled()
      expect(fileStore.refresh).toHaveBeenCalledTimes(2)
      expect(tabStore.updatePath).toHaveBeenCalledWith('/source/file.md', '/dest/file.md')
    })
  })

  describe('removeFromTree', () => {
    it('should remove from tree and update tabs', () => {
      const mockEntry = { path: '/test/folder', children: [] }

      const { removeFromTree } = useFile()
      removeFromTree(mockEntry)

      expect(fileStore.removeRoot).toHaveBeenCalledWith('/test/folder')
      expect(tabStore.updatePath).toHaveBeenCalledWith('/test/folder', null)
    })
  })

  describe('clearAllRecent', () => {
    it('should clear all recent files after confirm', async () => {
      vi.mocked(dialogService.confirm).mockResolvedValue(true)

      const { clearAllRecent } = useFile()
      clearAllRecent()
      await flushPromises()

      expect(dialogService.confirm).toHaveBeenCalled()
      expect(recentStore.clearAll).toHaveBeenCalled()
    })

    it('should not clear when cancelled', async () => {
      vi.mocked(dialogService.confirm).mockResolvedValue(false)

      const { clearAllRecent } = useFile()
      clearAllRecent()
      await flushPromises()

      expect(recentStore.clearAll).not.toHaveBeenCalled()
    })
  })
})
