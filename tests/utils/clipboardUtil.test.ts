import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handlePaste, uploadImage } from '@/utils/clipboardUtil.ts'
import type { AppFileInfo } from '@/types/appTypes'
import { MilkdownEditorInstance } from '@/components/editor/markdown/milkdown/composable/milkdownEditor'

vi.mock('nanoid', () => ({
  nanoid: vi.fn().mockReturnValue('test-id'),
}))

vi.mock('@/stores/settingsStore.ts', () => ({
  useSettingsStore: vi.fn().mockReturnValue({
    state: {
      file: {
        image: {
          externImagePathOptions: 'transfer',
          imagePathTypeOptions: 'relative',
        }
      }
    }
  }),
}))

vi.mock('@/services/files/fileService', () => ({
  fileService: {
    exists: vi.fn(),
    create: vi.fn(),
    writeFile: vi.fn(),
  },
}))

vi.mock('@/utils/formatUtil', () => ({
  nowFormatDate: vi.fn().mockReturnValue({ value: '20230101120000' }),
}))

import { fileService } from '@/services/files/fileService'

describe('clipboardUtil', () => {
  let mockEditor: MilkdownEditorInstance
  let mockFileInfo: AppFileInfo

  beforeEach(() => {
    mockEditor = {
      getFileInfo: vi.fn(),
      insertImage: vi.fn(),
    } as unknown as MilkdownEditorInstance

    mockFileInfo = {
      path: '/test/path/file.md',
      name: 'file.md',
      isDir: false,
      storageLocation: 'local',
      lastModified: 0,
    }

    vi.clearAllMocks()
  })

  describe('handlePaste', () => {
    it('should do nothing when no image in clipboard', () => {
      const event = {
        clipboardData: {
          items: [
            { kind: 'string', type: 'text/plain' },
          ],
        },
        preventDefault: vi.fn(),
        stopImmediatePropagation: vi.fn(),
      } as unknown as ClipboardEvent

      handlePaste(event, mockEditor)
      expect(event.preventDefault).not.toHaveBeenCalled()
      expect(event.stopImmediatePropagation).not.toHaveBeenCalled()
    })

    it('should prevent default when image is in clipboard', async () => {
      const event = {
        clipboardData: {
          items: [
            { kind: 'file', type: 'image/png', getAsFile: () => new Blob() },
          ],
        },
        preventDefault: vi.fn(),
        stopImmediatePropagation: vi.fn(),
      } as unknown as ClipboardEvent

      vi.spyOn(mockEditor, 'getFileInfo').mockReturnValue(mockFileInfo)
      vi.spyOn(fileService, 'exists').mockResolvedValue(true)
      vi.spyOn(fileService, 'writeFile').mockResolvedValue(undefined)

      await handlePaste(event, mockEditor)
      expect(event.preventDefault).toHaveBeenCalled()
      expect(event.stopImmediatePropagation).toHaveBeenCalled()
    })

    it('should do nothing when editor returns no file info', () => {
      const event = {
        clipboardData: {
          items: [
            { kind: 'file', type: 'image/png', getAsFile: () => new Blob() },
          ],
        },
        preventDefault: vi.fn(),
        stopImmediatePropagation: vi.fn(),
      } as unknown as ClipboardEvent

      vi.spyOn(mockEditor, 'getFileInfo').mockReturnValue(null)

      handlePaste(event, mockEditor)
      expect(event.preventDefault).toHaveBeenCalled()
      expect(event.stopImmediatePropagation).toHaveBeenCalled()
      expect(mockEditor.insertImage).not.toHaveBeenCalled()
    })

    it('should handle HTML paste with image file', async () => {
      const html = '<img src="https://example.com/image.png" alt="test">'

      const event = {
        clipboardData: {
          items: [
            { kind: 'string', type: 'text/html', getAsString: vi.fn((callback) => callback(html)) },
            { kind: 'file', type: 'image/png', getAsFile: () => new Blob() },
          ],
        },
        preventDefault: vi.fn(),
        stopImmediatePropagation: vi.fn(),
      } as unknown as ClipboardEvent

      vi.spyOn(mockEditor, 'getFileInfo').mockReturnValue(mockFileInfo)
      vi.spyOn(fileService, 'exists').mockResolvedValue(true)
      vi.spyOn(fileService, 'writeFile').mockResolvedValue(undefined)

      await handlePaste(event, mockEditor)
      expect(event.preventDefault).toHaveBeenCalled()
    })

    it('should handle paste with both HTML and image file', async () => {
      const html = '<img src="https://example.com/image.png" alt="test">'

      const event = {
        clipboardData: {
          items: [
            { kind: 'string', type: 'text/html', getAsString: vi.fn((callback) => callback(html)) },
            { kind: 'file', type: 'image/png', getAsFile: () => new Blob() },
          ],
        },
        preventDefault: vi.fn(),
        stopImmediatePropagation: vi.fn(),
      } as unknown as ClipboardEvent

      vi.spyOn(mockEditor, 'getFileInfo').mockReturnValue(mockFileInfo)
      vi.spyOn(fileService, 'exists').mockResolvedValue(true)
      vi.spyOn(fileService, 'writeFile').mockResolvedValue(undefined)

      await handlePaste(event, mockEditor)
      expect(event.preventDefault).toHaveBeenCalled()
    })
  })

  describe('uploadImage', () => {
    it('should upload image and return relative path', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/png' })

      vi.spyOn(fileService, 'exists').mockResolvedValue(false)
      vi.spyOn(fileService, 'create').mockResolvedValue(undefined)
      vi.spyOn(fileService, 'writeFile').mockResolvedValue(undefined)

      const result = await uploadImage(mockBlob, mockFileInfo)
      expect(result).toBe('../file.assets/20230101120000-test-id.png')
      expect(fileService.create).toHaveBeenCalled()
      expect(fileService.writeFile).toHaveBeenCalled()
    })

    it('should upload image when assets directory already exists', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/jpeg' })

      vi.spyOn(fileService, 'exists').mockResolvedValue(true)
      vi.spyOn(fileService, 'create').mockResolvedValue(undefined)
      vi.spyOn(fileService, 'writeFile').mockResolvedValue(undefined)

      const result = await uploadImage(mockBlob, mockFileInfo)
      expect(result).toBe('../file.assets/20230101120000-test-id.jpg')
      expect(fileService.create).not.toHaveBeenCalled()
      expect(fileService.writeFile).toHaveBeenCalled()
    })

    it('should use default extension when mime type is unknown', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/unknown' })

      vi.spyOn(fileService, 'exists').mockResolvedValue(true)
      vi.spyOn(fileService, 'writeFile').mockResolvedValue(undefined)

      const result = await uploadImage(mockBlob, mockFileInfo)
      expect(result).toBe('../file.assets/20230101120000-test-id.png')
    })

    it('should handle different image types', async () => {
      const testCases = [
        ['image/png', 'png'],
        ['image/jpeg', 'jpg'],
        ['image/gif', 'gif'],
        ['image/webp', 'webp'],
        ['image/svg+xml', 'svg'],
      ]

      for (const [mimeType, expectedExt] of testCases) {
        vi.spyOn(fileService, 'exists').mockResolvedValue(true)
        vi.spyOn(fileService, 'writeFile').mockResolvedValue(undefined)

        const mockBlob = new Blob(['test'], { type: mimeType })
        const result = await uploadImage(mockBlob, mockFileInfo)
        expect(result).toBe(`../file.assets/20230101120000-test-id.${expectedExt}`)
      }
    })

    it('should create assets directory when it does not exist', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/png' })

      vi.spyOn(fileService, 'exists').mockResolvedValue(false)
      vi.spyOn(fileService, 'create').mockResolvedValue(undefined)
      vi.spyOn(fileService, 'writeFile').mockResolvedValue(undefined)

      await uploadImage(mockBlob, mockFileInfo)
      expect(fileService.create).toHaveBeenCalledWith(expect.objectContaining({
        path: '/test/path/file.assets',
        isDir: true,
      }))
    })
  })
})
