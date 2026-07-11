import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createFileInnerSrc,
  isSubPath,
  getDirname,
  getFilename,
  getStem,
  getExtname,
  isRelativePath,
  isSameOrigin,
  isValidFilePath,
  createFileSrc,
  closeImageSource,
  getJoin,
  getRelative,
  normalizedPath,
} from '@/utils/pathUtil'
import type { AppFileInfo } from '@/types/appTypes'

vi.mock('@tauri-apps/api/core', () => ({
  isTauri: vi.fn(),
  convertFileSrc: vi.fn().mockImplementation((path) => `localhost://${path}`),
}))

vi.mock('@/services/files/fileService', () => ({
  fileService: {
    readFile: vi.fn().mockResolvedValue('file content'),
  },
}))

describe('pathUtil', () => {
  const mockFileInfo: AppFileInfo = {
    path: '/path/to/file',
    name: 'file',
    isDir: false,
    storageLocation: 'local',
    lastModified: 1641111111111,
  }

  const mockWebDavFileInfo: AppFileInfo = {
    path: 'https://example.com/webdav/file',
    name: 'file',
    isDir: false,
    storageLocation: 'remote',
    lastModified: 1641111111111,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createFileInnerSrc', () => {
    it('should handle empty url', async () => {
      const src = await createFileInnerSrc(mockFileInfo, '')
      expect(src).toBe('')
    })

    it('should handle relative paths in Tauri', async () => {
      vi.mocked(await import('@tauri-apps/api/core')).isTauri.mockReturnValue(true)
      const src = await createFileInnerSrc(mockFileInfo, './assets/image.png')
      expect(src).toBe('localhost:///path/to/file/assets/image.png')
    })

    it('should handle absolute paths in Tauri', async () => {
      vi.mocked(await import('@tauri-apps/api/core')).isTauri.mockReturnValue(true)
      const src = await createFileInnerSrc(mockFileInfo, '/absolute/path/image.png')
      expect(src).toBe('localhost:///absolute/path/image.png')
    })

    it('should handle file:// prefix in Tauri', async () => {
      vi.mocked(await import('@tauri-apps/api/core')).isTauri.mockReturnValue(true)
      const src = await createFileInnerSrc(mockFileInfo, 'file:///path/image.png')
      expect(src).toBe('localhost:///path/image.png')
    })

    it('should handle WebDAV files with same origin', async () => {
      const src = await createFileInnerSrc(mockWebDavFileInfo, 'https://example.com/webdav/assets/image.png')
      expect(src).toMatch(/^blob:/)
    })

    it('should handle WebDAV files with relative path', async () => {
      const src = await createFileInnerSrc(mockWebDavFileInfo, './assets/image.png')
      expect(src).toMatch(/^blob:/)
    })

    it('should return url as-is for different origin', async () => {
      const src = await createFileInnerSrc(mockWebDavFileInfo, 'https://other.com/image.png')
      expect(src).toBe('https://other.com/image.png')
    })
  })

  describe('createFileSrc', () => {
    it('should handle local files in Tauri', async () => {
      vi.mocked(await import('@tauri-apps/api/core')).isTauri.mockReturnValue(true)
      const src = await createFileSrc(mockFileInfo)
      expect(src).toBe('localhost:///path/to/file')
    })

    it('should handle WebDAV files', async () => {
      const src = await createFileSrc(mockWebDavFileInfo)
      expect(src).toMatch(/^blob:/)
    })

    it('should return path for browser local files', async () => {
      vi.mocked(await import('@tauri-apps/api/core')).isTauri.mockReturnValue(false)
      const src = await createFileSrc(mockFileInfo)
      expect(src).toBe('/path/to/file')
    })
  })

  describe('closeImageSource', () => {
    it('should revoke blob URL', () => {
      const mockRevoke = vi.fn()
      const originalRevoke = URL.revokeObjectURL
      URL.revokeObjectURL = mockRevoke

      closeImageSource('blob:mock-url')
      expect(mockRevoke).toHaveBeenCalledWith('blob:mock-url')

      URL.revokeObjectURL = originalRevoke
    })

    it('should not revoke non-blob URLs', () => {
      const mockRevoke = vi.fn()
      const originalRevoke = URL.revokeObjectURL
      URL.revokeObjectURL = mockRevoke

      closeImageSource('https://example.com/image.png')
      expect(mockRevoke).not.toHaveBeenCalled()

      URL.revokeObjectURL = originalRevoke
    })
  })

  describe('getJoin', () => {
    it('should join URL paths', () => {
      const result = getJoin('https://example.com/path', 'to', 'file')
      expect(result).toBe('https://example.com/path/to/file')
    })

    it('should join local paths', () => {
      const result = getJoin('/path', 'to', 'file')
      expect(result).toBe('/path/to/file')
    })

    it('should handle empty input', () => {
      const result = getJoin()
      expect(result).toBe('')
    })

    it('should handle single path', () => {
      const result = getJoin('/path/to/file')
      expect(result).toBe('/path/to/file')
    })
  })

  describe('getRelative', () => {
    it('should return relative path for local paths', () => {
      const result = getRelative('/path/to', '/path/to/file')
      expect(result).toBe('file')
    })

    it('should return relative path for URL paths', () => {
      const result = getRelative('https://example.com/path/to', 'https://example.com/path/to/file')
      expect(result).toBe('file')
    })

    it('should throw error for different origins', () => {
      expect(() => getRelative('https://example.com/path', 'https://other.com/path')).toThrow()
    })
  })

  describe('isSubPath', () => {
    it('should identify subpaths', () => {
      expect(isSubPath('https://example.com/api', 'https://example.com/api/v1')).toBe(true)
      expect(isSubPath('/path/to', '/path/to/file')).toBe(true)
    })

    it('should reject non-subpaths', () => {
      expect(isSubPath('https://example.com/api', 'https://other.com')).toBe(false)
      expect(isSubPath('/path/to', '/other/path')).toBe(false)
    })

    it('should handle case insensitivity', () => {
      expect(isSubPath('/Path/To', '/path/to/file')).toBe(true)
    })

    it('should handle trailing slashes', () => {
      expect(isSubPath('/path/to/', '/path/to/file')).toBe(true)
      expect(isSubPath('/path/to', '/path/to/file/')).toBe(true)
    })

    it('should handle exact match', () => {
      expect(isSubPath('/path/to', '/path/to')).toBe(true)
    })

    it('should not match partial segments', () => {
      expect(isSubPath('/path/to', '/path/todo')).toBe(false)
    })
  })

  describe('path utilities', () => {
    it('getDirname should return directory path for absolute paths', () => {
      expect(getDirname('/path/to/file.txt')).toBe('/path/to')
      expect(getDirname('https://example.com/path/to')).toBe('https://example.com/path')
    })

    it('getDirname should return directory path for relative paths', () => {
      expect(getDirname('path/to/file.txt')).toBe('path/to')
      expect(getDirname('file.txt')).toBe('')
    })

    it('getFilename should return filename for absolute paths', () => {
      expect(getFilename('/path/to/file.txt')).toBe('file.txt')
      expect(getFilename('https://example.com/path/to/file.txt')).toBe('file.txt')
    })

    it('getFilename should return filename for relative paths', () => {
      expect(getFilename('path/to/file.txt')).toBe('file.txt')
      expect(getFilename('file.txt')).toBe('file.txt')
    })

    it('getStem should return filename without extension', () => {
      expect(getStem('/path/to/file.txt')).toBe('file')
      expect(getStem('file.txt')).toBe('file')
      expect(getStem('file')).toBe('file')
    })

    it('getExtname should return extension for absolute paths', () => {
      expect(getExtname('/path/to/file.txt')).toBe('.txt')
      expect(getExtname('/path/to/file')).toBe('')
    })

    it('getExtname should return extension for relative paths', () => {
      expect(getExtname('file.txt')).toBe('.txt')
      expect(getExtname('file')).toBe('')
      expect(getExtname('.hidden')).toBe('')
    })

    it('normalizedPath should remove trailing slashes', () => {
      expect(normalizedPath('/path/to/file/')).toBe('/path/to/file')
      expect(normalizedPath('/path/to/file')).toBe('/path/to/file')
    })
  })

  describe('isRelativePath', () => {
    it('should identify relative paths', () => {
      expect(isRelativePath('./file')).toBe(true)
      expect(isRelativePath('../file')).toBe(true)
      expect(isRelativePath('file')).toBe(true)
      expect(isRelativePath('path/to/file')).toBe(true)
    })

    it('should reject absolute paths', () => {
      expect(isRelativePath('/path/to/file')).toBe(false)
      expect(isRelativePath('C:\\path\\to\\file')).toBe(false)
    })

    it('should reject URLs', () => {
      expect(isRelativePath('https://example.com/file')).toBe(false)
      expect(isRelativePath('http://example.com/file')).toBe(false)
    })

    it('should reject paths with illegal characters', () => {
      expect(isRelativePath('/path/with?query')).toBe(false)
      expect(isRelativePath('/path/with*star')).toBe(false)
      expect(isRelativePath('/path/with"quote')).toBe(false)
      expect(isRelativePath('/path/with<less')).toBe(false)
      expect(isRelativePath('/path/with>greater')).toBe(false)
      expect(isRelativePath('/path/with|pipe')).toBe(false)
    })

    it('should handle whitespace', () => {
      expect(isRelativePath('  ./file  ')).toBe(true)
    })
  })

  describe('isSameOrigin', () => {
    it('should identify same origin URLs', () => {
      expect(isSameOrigin('https://example.com', 'https://example.com/path')).toBe(true)
      expect(isSameOrigin('https://example.com:443', 'https://example.com/path')).toBe(true)
      expect(isSameOrigin('http://example.com:80', 'http://example.com/path')).toBe(true)
    })

    it('should reject different origin URLs', () => {
      expect(isSameOrigin('https://example.com', 'https://other.com')).toBe(false)
      expect(isSameOrigin('https://example.com', 'http://example.com')).toBe(false)
      expect(isSameOrigin('https://example.com:8080', 'https://example.com')).toBe(false)
    })

    it('should handle invalid URLs', () => {
      expect(isSameOrigin('invalid', '/path')).toBe(false)
    })
  })

  describe('isValidFilePath', () => {
    it('should validate correct paths', () => {
      expect(isValidFilePath('/path/to/file.txt')).toBe(true)
      expect(isValidFilePath('valid-file-name')).toBe(true)
      expect(isValidFilePath('path/with spaces/file.txt')).toBe(true)
    })

    it('should reject paths with illegal characters', () => {
      expect(isValidFilePath('/path/with?query')).toBe(false)
      expect(isValidFilePath('/path/with*star')).toBe(false)
      expect(isValidFilePath('/path/with"quote')).toBe(false)
      expect(isValidFilePath('/path/with<less')).toBe(false)
      expect(isValidFilePath('/path/with>greater')).toBe(false)
      expect(isValidFilePath('/path/with|pipe')).toBe(false)
    })

    it('should handle whitespace', () => {
      expect(isValidFilePath('  /path/to/file.txt  ')).toBe(true)
    })
  })
})
