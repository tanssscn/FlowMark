import { describe, it, expect, vi } from 'vitest'
import {
  createFileInnerSrc,
  httpJoin,
  relativeHttpPath,
  isSubPath,
  getDirname,
  getFilename,
  getStem,
  getExtname,
  isRelativePath,
  isSameOrigin,
  isValidFilePath,
} from '@/utils/pathUtil'
import type { AppFileInfo } from '@/types/appTypes'

describe('pathUtil', () => {
  const mockFileInfo: AppFileInfo = {
    path: '/path/to/file',
    name: 'file',
    isDir: false,
    storageLocation: 'local',
    lastModified: 1641111111111,
  }

  describe('createFileInnerSrc', () => {
    it('should handle relative paths in Tauri', async () => {
      vi.mock('@tauri-apps/api/core', () => ({
        isTauri: vi.fn().mockReturnValue(true),
        convertFileSrc: vi.fn().mockImplementation((path) => `localhost://${path}`),
      }))

      const src = await createFileInnerSrc(mockFileInfo, '/path/to/file.assets/image.png')
      expect(src).toBe('localhost:///path/to/file.assets/image.png')
    })
  })

  describe('httpJoin', () => {
    it('should join HTTP paths correctly', () => {
      expect(httpJoin('https://example.com', 'api', 'v1')).toBe('https://example.com/api/v1')
      expect(httpJoin('https://example.com/', '/api/', '/v1/')).toBe('https://example.com/api/v1')
    })

    it('should handle query parameters', () => {
      expect(httpJoin('https://example.com', 'api?param=1')).toBe('https://example.com/api?param=1')
    })
  })

  describe('relativeHttpPath', () => {
    it('should return relative path for subpaths', () => {
      expect(relativeHttpPath('https://example.com/api', 'https://example.com/api/v1')).toBe('v1')
    })

    it('should return empty string for non-subpaths', () => {
      expect(relativeHttpPath('https://example.com/api', 'https://other.com')).toBe('')
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
  })

  describe('path utilities', () => {
    it('getDirname should return directory path', () => {
      expect(getDirname('/path/to/file.txt')).toBe('/path/to')
      expect(getDirname('https://example.com/path/to')).toBe('https://example.com/path')
    })

    it('getFilename should return filename', () => {
      expect(getFilename('/path/to/file.txt')).toBe('file.txt')
      expect(getFilename('https://example.com/path/to/file.txt')).toBe('file.txt')
    })

    it('getStem should return filename without extension', () => {
      expect(getStem('/path/to/file.txt')).toBe('file')
    })

    it('getExtname should return extension', () => {
      expect(getExtname('/path/to/file.txt')).toBe('.txt')
    })
  })

  describe('isRelativePath', () => {
    it('should identify relative paths', () => {
      expect(isRelativePath('./file')).toBe(true)
      expect(isRelativePath('../file')).toBe(true)
    })

    it('should reject absolute paths', () => {
      expect(isRelativePath('/path/to/file')).toBe(false)
      expect(isRelativePath('C:\\path\\to\\file')).toBe(false)
    })
  })

  describe('isSameOrigin', () => {
    it('should identify same origin URLs', () => {
      expect(isSameOrigin('https://example.com', 'https://example.com/path')).toBe(true)
    })

    it('should reject different origin URLs', () => {
      expect(isSameOrigin('https://example.com', 'https://other.com')).toBe(false)
    })
  })

  describe('isValidFilePath', () => {
    it('should validate correct paths', () => {
      expect(isValidFilePath('/path/to/file.txt')).toBe(true)
      expect(isValidFilePath('valid-file-name')).toBe(true)
    })

    it('should reject paths with illegal characters', () => {
      expect(isValidFilePath('/path/with?query')).toBe(false)
      expect(isValidFilePath('/path/with*star')).toBe(false)
    })
  })
})