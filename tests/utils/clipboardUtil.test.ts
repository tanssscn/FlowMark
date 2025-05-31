import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handlePaste, uploadImage } from '@/utils/clipboardUtil.ts'
import type { AppFileInfo } from '@/types/appTypes'
import { MilkdownEditorInstance } from '@/components/editor/milkdown/composable/milkdownEditor'

describe('clipboardUtil', () => {
  let mockEditor: MilkdownEditorInstance
  let mockFileInfo: AppFileInfo

  beforeEach(() => {
    mockEditor = {
      getFileInfo: vi.fn(),
      insertImage: vi.fn(),
    } as unknown as MilkdownEditorInstance

    mockFileInfo = {
      path: '/test/path',
      name: 'test',
      isDir: false,
      storageLocation: 'local',
      lastModified: 0,
    }
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
      } as unknown as ClipboardEvent

      handlePaste(event, mockEditor)
      expect(event.preventDefault).not.toHaveBeenCalled()
    })

    it('should prevent default when image is in clipboard', () => {
      const event = {
        clipboardData: {
          items: [
            { kind: 'file', type: 'image/png', getAsFile: () => new Blob() },
          ],
        },
        preventDefault: vi.fn(),
      } as unknown as ClipboardEvent

      vi.spyOn(mockEditor, 'getFileInfo').mockReturnValue(mockFileInfo)
      handlePaste(event, mockEditor)
      expect(event.preventDefault).toHaveBeenCalled()
    })
  })

  describe('uploadImage', () => {
    it('should upload image and return path', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/png' })
      const mockFileService = {
        exists: vi.fn().mockResolvedValue(false),
        create: vi.fn().mockResolvedValue(undefined),
        writeFile: vi.fn().mockResolvedValue(undefined),
      }

      vi.mock('@/services/files/fileService', () => ({
        fileService: mockFileService,
      }))

      const result = await uploadImage(mockBlob, mockFileInfo)
      expect(result).toMatch(/\/test\/path\.assets\/\d{14}-.{4}\.png/)
      expect(mockFileService.create).toHaveBeenCalled()
      expect(mockFileService.writeFile).toHaveBeenCalled()
    })
  })
})