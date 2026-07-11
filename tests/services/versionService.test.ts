import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockFs } = vi.hoisted(() => ({
  mockFs: {
    exists: vi.fn().mockResolvedValue(false),
    mkdir: vi.fn().mockResolvedValue(),
    readTextFile: vi.fn().mockResolvedValue(''),
    writeTextFile: vi.fn().mockResolvedValue(),
    remove: vi.fn().mockResolvedValue(),
  },
}))

vi.mock('@tauri-apps/plugin-fs', () => ({
  exists: vi.fn().mockImplementation((path: string) => mockFs.exists(path)),
  mkdir: vi.fn().mockImplementation((path: string) => mockFs.mkdir(path)),
  readTextFile: vi.fn().mockImplementation((path: string) => mockFs.readTextFile(path)),
  writeTextFile: vi.fn().mockImplementation((path: string, content: string) => mockFs.writeTextFile(path, content)),
  remove: vi.fn().mockImplementation((path: string) => mockFs.remove(path)),
  BaseDirectory: {
    AppData: 2,
  },
}))

vi.mock('@/services/deviceService', () => ({
  getDeviceInfo: vi.fn().mockReturnValue({ isBrowser: false }),
}))

vi.mock('nanoid', () => ({
  customAlphabet: vi.fn().mockReturnValue(() => 'test123'),
}))

import { VersionService } from '@/services/versions/versionService'

describe('VersionService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFs.exists.mockResolvedValue(false)
    mockFs.mkdir.mockResolvedValue()
    mockFs.readTextFile.mockResolvedValue('')
    mockFs.writeTextFile.mockResolvedValue()
    mockFs.remove.mockResolvedValue()
  })

  describe('createVersion', () => {
    it('should create new version', async () => {
      mockFs.exists.mockResolvedValue(false)
      mockFs.readTextFile.mockResolvedValue('')

      const service = new VersionService()
      const versions = await service.createVersion({
        filePath: '/test/file.txt',
        content: 'test content',
        message: 'Initial version',
      })

      expect(versions.length).toBe(1)
      expect(versions[0].message).toBe('Initial version')
      expect(mockFs.writeTextFile).toHaveBeenCalled()
    })

    it('should limit versions by maxNum', async () => {
      mockFs.exists.mockResolvedValue(true)
      mockFs.readTextFile.mockResolvedValue(JSON.stringify({
        source: '/test/file.txt',
        entries: [
          { id: 'v1', createdAt: Date.now() - 300000, message: 'v1' },
          { id: 'v2', createdAt: Date.now() - 200000, message: 'v2' },
          { id: 'v3', createdAt: Date.now() - 100000, message: 'v3' },
        ],
      }))

      const service = new VersionService()
      const versions = await service.createVersion({
        filePath: '/test/file.txt',
        content: 'new content',
        maxNum: 3,
      })

      expect(versions.length).toBe(3)
      expect(mockFs.remove).toHaveBeenCalled()
    })
  })

  describe('listVersions', () => {
    it('should return versions from metadata', async () => {
      mockFs.exists.mockResolvedValue(true)
      mockFs.readTextFile.mockResolvedValue(JSON.stringify({
        source: '/test/file.txt',
        entries: [
          { id: 'v1', createdAt: Date.now(), message: 'v1' },
        ],
      }))

      const service = new VersionService()
      const versions = await service.listVersions('/test/file.txt')

      expect(versions.length).toBe(1)
      expect(versions[0].id).toBe('v1')
    })

    it('should return empty array when no metadata', async () => {
      mockFs.exists.mockResolvedValue(false)

      const service = new VersionService()
      const versions = await service.listVersions('/test/file.txt')

      expect(versions).toEqual([])
    })
  })

  describe('getVersion', () => {
    it('should return version content', async () => {
      mockFs.exists.mockResolvedValue(true)
      mockFs.readTextFile.mockImplementation((path: string) => {
        if (path.includes('metadata')) {
          return JSON.stringify({
            source: '/test/file.txt',
            entries: [{ id: 'test123txt', createdAt: Date.now(), message: 'v1' }],
          })
        }
        return 'version content'
      })

      const service = new VersionService()
      const content = await service.getVersion('/test/file.txt', 'test123txt')

      expect(content).toBe('version content')
    })

    it('should return null when version not found', async () => {
      mockFs.exists.mockResolvedValue(true)
      mockFs.readTextFile.mockResolvedValue(JSON.stringify({
        source: '/test/file.txt',
        entries: [{ id: 'v1', createdAt: Date.now(), message: 'v1' }],
      }))

      const service = new VersionService()
      const content = await service.getVersion('/test/file.txt', 'unknown')

      expect(content).toBe(null)
    })
  })

  describe('deleteVersion', () => {
    it('should delete specific version', async () => {
      mockFs.exists.mockResolvedValue(true)
      mockFs.readTextFile.mockResolvedValue(JSON.stringify({
        source: '/test/file.txt',
        entries: [
          { id: 'v1', createdAt: Date.now(), message: 'v1' },
          { id: 'v2', createdAt: Date.now(), message: 'v2' },
        ],
      }))

      const service = new VersionService()
      const versions = await service.deleteVersion('/test/file.txt', 'v1')

      expect(versions.length).toBe(1)
      expect(versions[0].id).toBe('v2')
      expect(mockFs.remove).toHaveBeenCalled()
    })

    it('should return unchanged versions when not found', async () => {
      mockFs.exists.mockResolvedValue(true)
      mockFs.readTextFile.mockResolvedValue(JSON.stringify({
        source: '/test/file.txt',
        entries: [{ id: 'v1', createdAt: Date.now(), message: 'v1' }],
      }))

      const service = new VersionService()
      const versions = await service.deleteVersion('/test/file.txt', 'unknown')

      expect(versions.length).toBe(1)
      expect(mockFs.remove).not.toHaveBeenCalled()
    })
  })

  describe('deleteVersions', () => {
    it('should delete all versions', async () => {
      mockFs.exists.mockResolvedValue(true)
      mockFs.readTextFile.mockResolvedValue(JSON.stringify({
        source: '/test/file.txt',
        entries: [
          { id: 'v1', createdAt: Date.now(), message: 'v1' },
          { id: 'v2', createdAt: Date.now(), message: 'v2' },
        ],
      }))

      const service = new VersionService()
      await service.deleteVersions('/test/file.txt')

      expect(mockFs.remove).toHaveBeenCalledTimes(2)
    })
  })
})
