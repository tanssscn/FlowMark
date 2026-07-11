import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fileService } from '@/services/files/fileService'

vi.mock('@/services/files/local/localFileService', () => ({
  localFileService: {
    readFile: vi.fn(),
    readTextFile: vi.fn(),
    writeTextFile: vi.fn(),
    delete: vi.fn(),
    rename: vi.fn(),
    copyFile: vi.fn(),
    exists: vi.fn(),
    getStat: vi.fn(),
    readDirectory: vi.fn(),
    createDirectory: vi.fn(),
    createFile: vi.fn(),
    writeFile: vi.fn(),
    saveFileDialog: vi.fn(),
    watchFileChange: vi.fn(),
  },
}))

vi.mock('@/services/files/webdav/webdavFileService', () => ({
  webdavFileService: {
    readFile: vi.fn(),
    readTextFile: vi.fn(),
    writeTextFile: vi.fn(),
    delete: vi.fn(),
    rename: vi.fn(),
    copyFile: vi.fn(),
    exists: vi.fn(),
    getStat: vi.fn(),
    readDirectory: vi.fn(),
    createDirectory: vi.fn(),
    createFile: vi.fn(),
    writeFile: vi.fn(),
    watchFileChange: vi.fn(),
  },
}))

import { localFileService } from '@/services/files/local/localFileService'
import { webdavFileService } from '@/services/files/webdav/webdavFileService'

describe('fileService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('readFile', () => {
    it('should call localFileService for local storage', async () => {
      await fileService.readFile({ path: '/test.txt', storageLocation: 'local' })
      expect(localFileService.readFile).toHaveBeenCalledWith({ path: '/test.txt', storageLocation: 'local' })
    })

    it('should call webdavFileService for webdav storage', async () => {
      await fileService.readFile({ path: '/test.txt', storageLocation: 'webdav' })
      expect(webdavFileService.readFile).toHaveBeenCalledWith({ path: '/test.txt', storageLocation: 'webdav' })
    })
  })

  describe('readTextFile', () => {
    it('should call localFileService for local storage', async () => {
      await fileService.readTextFile({ path: '/test.txt', storageLocation: 'local' })
      expect(localFileService.readTextFile).toHaveBeenCalled()
    })

    it('should call webdavFileService for webdav storage', async () => {
      await fileService.readTextFile({ path: '/test.txt', storageLocation: 'webdav' })
      expect(webdavFileService.readTextFile).toHaveBeenCalled()
    })
  })

  describe('writeTextFile', () => {
    it('should call localFileService for local storage', async () => {
      await fileService.writeTextFile({ path: '/test.txt', storageLocation: 'local' }, 'content')
      expect(localFileService.writeTextFile).toHaveBeenCalledWith({ path: '/test.txt', storageLocation: 'local' }, 'content')
    })

    it('should call webdavFileService for webdav storage', async () => {
      await fileService.writeTextFile({ path: '/test.txt', storageLocation: 'webdav' }, 'content')
      expect(webdavFileService.writeTextFile).toHaveBeenCalled()
    })
  })

  describe('delete', () => {
    it('should call localFileService for local storage', async () => {
      await fileService.delete({ path: '/test.txt', storageLocation: 'local', isDir: false })
      expect(localFileService.delete).toHaveBeenCalled()
    })

    it('should call webdavFileService for webdav storage', async () => {
      await fileService.delete({ path: '/test.txt', storageLocation: 'webdav', isDir: false })
      expect(webdavFileService.delete).toHaveBeenCalled()
    })
  })

  describe('rename', () => {
    it('should call localFileService for local storage', async () => {
      await fileService.rename({ path: '/old.txt', storageLocation: 'local', isDir: false }, '/new.txt')
      expect(localFileService.rename).toHaveBeenCalled()
    })
  })

  describe('copyFile', () => {
    it('should call localFileService for local storage', async () => {
      await fileService.copyFile({ path: '/source.txt', storageLocation: 'local' }, '/dest.txt')
      expect(localFileService.copyFile).toHaveBeenCalled()
    })
  })

  describe('exists', () => {
    it('should call localFileService for local storage', async () => {
      await fileService.exists({ path: '/test.txt', storageLocation: 'local', isDir: false })
      expect(localFileService.exists).toHaveBeenCalled()
    })
  })

  describe('getStat', () => {
    it('should call localFileService for local storage', async () => {
      await fileService.getStat({ path: '/test.txt', storageLocation: 'local', isDir: false })
      expect(localFileService.getStat).toHaveBeenCalled()
    })
  })

  describe('readDirectory', () => {
    it('should call localFileService for local storage', async () => {
      await fileService.readDirectory({ path: '/dir', storageLocation: 'local' })
      expect(localFileService.readDirectory).toHaveBeenCalled()
    })
  })

  describe('create', () => {
    it('should create directory when isDir is true', async () => {
      await fileService.create({ path: '/dir', storageLocation: 'local', isDir: true })
      expect(localFileService.createDirectory).toHaveBeenCalled()
    })

    it('should create file when isDir is false', async () => {
      await fileService.create({ path: '/file.txt', storageLocation: 'local', isDir: false })
      expect(localFileService.createFile).toHaveBeenCalled()
    })

    it('should create directory recursively', async () => {
      await fileService.create({ path: '/dir/sub', storageLocation: 'local', isDir: true }, true)
      expect(localFileService.createDirectory).toHaveBeenCalledWith(
        { path: '/dir/sub', storageLocation: 'local', isDir: true },
        true
      )
    })
  })

  describe('writeFile', () => {
    it('should call localFileService for local storage', async () => {
      const blob = new Blob(['content'])
      await fileService.writeFile({ path: '/test.txt', storageLocation: 'local' }, blob)
      expect(localFileService.writeFile).toHaveBeenCalled()
    })
  })

  describe('saveFileDialog', () => {
    it('should call localFileService saveFileDialog', async () => {
      await fileService.saveFileDialog({ title: 'Save' })
      expect(localFileService.saveFileDialog).toHaveBeenCalledWith({ title: 'Save' })
    })
  })

  describe('watchFileChange', () => {
    it('should call localFileService watchFileChange', async () => {
      const callback = () => {}
      await fileService.watchFileChange({ path: '/test.txt', storageLocation: 'local' }, callback)
      expect(localFileService.watchFileChange).toHaveBeenCalled()
    })
  })

  describe('copyAcrossStorage', () => {
    it('should copy file within same storage', async () => {
      await fileService.copyAcrossStorage(
        { path: '/source.txt', storageLocation: 'local', isDir: false },
        { path: '/dest.txt', storageLocation: 'local' }
      )
      expect(localFileService.copyFile).toHaveBeenCalled()
    })

    it('should copy directory across different storage', async () => {
      vi.mocked(webdavFileService.readDirectory).mockResolvedValue({
        path: '/source',
        name: 'source',
        isDir: true,
        storageLocation: 'webdav',
        children: [{ path: '/source/file.txt', name: 'file.txt', isDir: false, storageLocation: 'webdav' }],
      } as any)
      vi.mocked(webdavFileService.readFile).mockResolvedValue('content')

      await fileService.copyAcrossStorage(
        { path: '/source', storageLocation: 'webdav', isDir: true },
        { path: '/dest', storageLocation: 'local' }
      )

      expect(localFileService.createDirectory).toHaveBeenCalled()
      expect(webdavFileService.readDirectory).toHaveBeenCalled()
      expect(localFileService.writeFile).toHaveBeenCalled()
    })

    it('should copy file across different storage', async () => {
      vi.mocked(localFileService.readFile).mockResolvedValue('content')

      await fileService.copyAcrossStorage(
        { path: '/source.txt', storageLocation: 'local', isDir: false },
        { path: '/dest.txt', storageLocation: 'webdav' }
      )

      expect(localFileService.readFile).toHaveBeenCalled()
      expect(webdavFileService.writeFile).toHaveBeenCalled()
    })
  })

  describe('moveAcrossStorage', () => {
    it('should move within same storage', async () => {
      await fileService.moveAcrossStorage(
        { path: '/old.txt', storageLocation: 'local', isDir: false },
        { path: '/new.txt', storageLocation: 'local' }
      )
      expect(localFileService.rename).toHaveBeenCalled()
    })

    it('should copy and delete across different storage', async () => {
      vi.mocked(localFileService.readFile).mockResolvedValue('content')

      await fileService.moveAcrossStorage(
        { path: '/source.txt', storageLocation: 'local', isDir: false },
        { path: '/dest.txt', storageLocation: 'webdav' }
      )

      expect(localFileService.readFile).toHaveBeenCalled()
      expect(webdavFileService.writeFile).toHaveBeenCalled()
      expect(localFileService.delete).toHaveBeenCalled()
    })
  })
})
