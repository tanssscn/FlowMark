import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0))
import { useEdit } from '@/composable/useEdit'

vi.mock('@/services/files/fileService', () => ({
  fileService: {
    readTextFile: vi.fn(),
    writeTextFile: vi.fn(),
    getStat: vi.fn(),
    saveFileDialog: vi.fn(),
  },
}))

vi.mock('@/stores/tabStore', () => ({
  useTabStore: vi.fn().mockReturnValue({
    currentTab: undefined,
    isCurrentTabByFilePath: vi.fn(),
    openInTab: vi.fn(),
    save: vi.fn(),
    closeTab: vi.fn(),
    updatePath: vi.fn(),
    state: undefined,
  }),
}))

vi.mock('@/stores/fileTreeStore', () => ({
  useFileStore: vi.fn().mockReturnValue({
    get: vi.fn(),
    set: vi.fn(),
  }),
}))

vi.mock('@/stores/settingsStore', () => ({
  useSettingsStore: vi.fn().mockReturnValue({
    state: {
      file: {
        history: {
          autoSave: true,
          autoSaveInterval: 1,
        },
        save: {
          autoSave: true,
        },
      },
    },
  }),
}))

vi.mock('@/components/sidebar/version/composable/useVersion', () => ({
  useVersion: vi.fn().mockReturnValue({
    saveVersion: vi.fn(),
  }),
}))

vi.mock('@/services/dialog/dialogService', () => ({
  dialogService: {
    confirm: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('@/services/window/windowService', () => ({
  windowServer: {
    setWindowTitle: vi.fn(),
  },
}))

vi.mock('@/services/milkdownManager', () => ({
  milkdownManager: {
    getEditor: vi.fn(),
  },
}))

vi.mock('@/i18n', () => ({
  default: {
    global: {
      t: (key: string) => key,
    },
  },
}))

import { useTabStore } from '@/stores/tabStore'
import { useFileStore } from '@/stores/fileTreeStore'
import { fileService } from '@/services/files/fileService'
import { dialogService } from '@/services/dialog/dialogService'
import { windowServer } from '@/services/window/windowService'
import { milkdownManager } from '@/services/milkdownManager'

describe('useEdit', () => {
  let tabStore: any
  let fileStore: any

  beforeEach(() => {
    vi.clearAllMocks()
    tabStore = {
      currentTab: undefined,
      isCurrentTabByFilePath: vi.fn().mockReturnValue(false),
      openInTab: vi.fn().mockReturnValue({ id: 'tab1', filePath: '/test/file.md' }),
      save: vi.fn(),
      closeTab: vi.fn(),
      updatePath: vi.fn(),
      state: undefined,
    }
    fileStore = {
      get: vi.fn().mockReturnValue({ path: '/test/file.md', storageLocation: 'local', isDir: false }),
      set: vi.fn(),
    }
    vi.mocked(useTabStore).mockReturnValue(tabStore)
    vi.mocked(useFileStore).mockReturnValue(fileStore)
  })

  describe('openFileOnTab', () => {
    it('should open file in tab', async () => {
      const mockFileInfo = { path: '/test/file.md', name: 'file.md', storageLocation: 'local', isDir: false }

      const { openFileOnTab } = useEdit()
      await openFileOnTab(mockFileInfo)

      expect(tabStore.openInTab).toHaveBeenCalledWith({
        filePath: '/test/file.md',
        isPinned: undefined,
      })
    })

    it('should not open file if already open', async () => {
      const mockFileInfo = { path: '/test/file.md', name: 'file.md', storageLocation: 'local', isDir: false }
      tabStore.isCurrentTabByFilePath = vi.fn().mockReturnValue(true)

      const { openFileOnTab } = useEdit()
      await openFileOnTab(mockFileInfo)

      expect(tabStore.openInTab).not.toHaveBeenCalled()
    })

    it('should open file with pinned option', async () => {
      const mockFileInfo = { path: '/test/file.md', name: 'file.md', storageLocation: 'local', isDir: false }

      const { openFileOnTab } = useEdit()
      await openFileOnTab(mockFileInfo, { pinTab: true })

      expect(tabStore.openInTab).toHaveBeenCalledWith({
        filePath: '/test/file.md',
        isPinned: true,
      })
    })
  })

  describe('saveFile', () => {
    it('should save file', async () => {
      tabStore.currentTab = { id: 'tab1', filePath: '/test/file.md', edit: { unsaved: true, version: 1 } }
      fileStore.get = vi.fn().mockReturnValue({ path: '/test/file.md', storageLocation: 'local', isDir: false, version: 1 })
      vi.mocked(fileService.getStat).mockResolvedValue({ version: 1, path: '/test/file.md', storageLocation: 'local', isDir: false })
      vi.mocked(fileService.writeTextFile).mockImplementation(async () => { })

      const { saveFile } = useEdit()
      const result = await saveFile('tab1', 'content')

      expect(result).toBe(true)
      expect(fileService.writeTextFile).toHaveBeenCalled()
      expect(tabStore.save).toHaveBeenCalled()
    })

    it('should not save if no unsaved changes', async () => {
      tabStore.currentTab = { id: 'tab1', filePath: '/test/file.md', edit: { unsaved: false } }

      const { saveFile } = useEdit()
      const result = await saveFile('tab1', 'content')

      expect(result).toBe(false)
      expect(fileService.writeTextFile).not.toHaveBeenCalled()
    })

    it('should handle version conflict', async () => {
      tabStore.currentTab = { id: 'tab1', filePath: '/test/file.md', edit: { unsaved: true, version: 1 } }
      vi.mocked(fileService.getStat).mockResolvedValue({ version: 2 })
      vi.mocked(dialogService.confirm).mockResolvedValue(true)

      const { saveFile } = useEdit()
      const result = await saveFile('tab1', 'content')

      expect(result).toBe(true)
    })

    it('should cancel save on version conflict', async () => {
      tabStore.currentTab = { id: 'tab1', filePath: '/test/file.md', edit: { unsaved: true, version: 1 } }
      vi.mocked(fileService.getStat).mockResolvedValue({ version: 2 })
      vi.mocked(dialogService.confirm).mockResolvedValue(false)

      const { saveFile } = useEdit()
      const result = await saveFile('tab1', 'content')

      expect(result).toBe(false)
      expect(fileService.writeTextFile).not.toHaveBeenCalled()
    })

    it('should handle save error', async () => {
      tabStore.currentTab = { id: 'tab1', filePath: '/test/file.md', edit: { unsaved: true, version: 1 } }
      fileStore.get = vi.fn().mockReturnValue({ path: '/test/file.md', storageLocation: 'local', isDir: false, version: 1 })
      vi.mocked(fileService.getStat).mockResolvedValue({ version: 1, path: '/test/file.md', storageLocation: 'local', isDir: false })
      vi.mocked(fileService.writeTextFile).mockRejectedValue(new Error('Save error'))

      const { saveFile } = useEdit()
      const result = await saveFile('tab1', 'content')

      expect(result).toBe(false)
      expect(dialogService.error).toHaveBeenCalled()
    })
  })

  describe('saveAsFile', () => {
    it('should save file as new path', async () => {
      tabStore.state = { filePath: '/test/file.md' }
      vi.mocked(fileService.saveFileDialog).mockResolvedValue('/new/path/file.md')

      const { saveAsFile } = useEdit()
      saveAsFile()
      await flushPromises()

      expect(fileService.saveFileDialog).toHaveBeenCalled()
      expect(fileStore.set).toHaveBeenCalled()
      expect(tabStore.updatePath).toHaveBeenCalled()
    })

    it('should do nothing when cancelled', async () => {
      tabStore.state = { filePath: '/test/file.md' }
      vi.mocked(fileService.saveFileDialog).mockResolvedValue(null)

      const { saveAsFile } = useEdit()
      saveAsFile()
      await flushPromises()

      expect(fileStore.set).not.toHaveBeenCalled()
    })
  })

  describe('readFileByTabId', () => {
    it('should read file content', async () => {
      tabStore.currentTab = { id: 'tab1', filePath: '/test/file.md' }
      vi.mocked(fileService.readTextFile).mockResolvedValue('content')

      const { readFileByTabId } = useEdit()
      const content = await readFileByTabId('tab1')

      expect(content).toBe('content')
    })

    it('should throw error when tab not found', async () => {
      tabStore.currentTab = { id: 'tab2', filePath: '/test/file.md' }

      const { readFileByTabId } = useEdit()
      await expect(readFileByTabId('tab1')).rejects.toThrow()
    })

    it('should throw error when file not in store', async () => {
      tabStore.currentTab = { id: 'tab1', filePath: '/test/file.md' }
      fileStore.get = vi.fn().mockReturnValue(undefined)

      const { readFileByTabId } = useEdit()
      await expect(readFileByTabId('tab1')).rejects.toThrow()
    })
  })

  describe('closeTab', () => {
    it('should close tab without unsaved changes', async () => {
      tabStore.currentTab = { id: 'tab1', edit: { unsaved: false } }

      const { closeTab } = useEdit()
      await closeTab()

      expect(tabStore.closeTab).toHaveBeenCalled()
    })

    it('should ask to save before closing', async () => {
      tabStore.currentTab = { id: 'tab1', edit: { unsaved: true } }
      vi.mocked(dialogService.confirm).mockResolvedValue(true)
      vi.mocked(milkdownManager.getEditor).mockReturnValue({ saveFile: vi.fn() })

      const { closeTab } = useEdit()
      await closeTab()

      expect(dialogService.confirm).toHaveBeenCalled()
    })

    it('should close without saving when cancelled', async () => {
      tabStore.currentTab = { id: 'tab1', edit: { unsaved: true } }
      vi.mocked(dialogService.confirm).mockResolvedValue(false)

      const { closeTab } = useEdit()
      await closeTab()

      expect(tabStore.closeTab).toHaveBeenCalled()
    })
  })

  describe('setWindowTitle', () => {
    it('should set window title', async () => {
      tabStore.state = { title: 'Test' }

      const { setWindowTitle } = useEdit()
      await setWindowTitle()

      expect(windowServer.setWindowTitle).toHaveBeenCalledWith('Test')
    })
  })

  describe('setUnsavedWindowTitle', () => {
    it('should set window title with asterisk', async () => {
      tabStore.state = { title: 'Test' }

      const { setUnsavedWindowTitle } = useEdit()
      await setUnsavedWindowTitle()

      expect(windowServer.setWindowTitle).toHaveBeenCalledWith('Test *')
    })
  })

  describe('restoreSession', () => {
    it('should close tab when file not found', async () => {
      tabStore.currentTab = { filePath: '/test/file.md' }
      fileStore.get = vi.fn().mockReturnValue(undefined)

      const { restoreSession } = useEdit()
      await restoreSession()

      expect(tabStore.closeTab).toHaveBeenCalled()
    })
  })
})
