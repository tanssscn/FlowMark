import { describe, it, expect } from 'vitest'
import { ignoreHiddenFiles, filterFileEntries, getTabType, enableEditTab, calculateDataLength } from '@/utils/fileUtil'
import { TabType } from '@/types/appTypes'

describe('fileUtil', () => {
  describe('ignoreHiddenFiles', () => {
    it('should ignore dot files on all platforms', () => {
      expect(ignoreHiddenFiles('.hidden')).toBe(true)
      expect(ignoreHiddenFiles('normal.txt')).toBe(false)
    })

    it('should ignore macOS specific files', () => {
      expect(ignoreHiddenFiles('.DS_Store', 'macos')).toBe(true)
      expect(ignoreHiddenFiles('._resource', 'macos')).toBe(true)
    })

    it('should ignore Windows specific files', () => {
      expect(ignoreHiddenFiles('Thumbs.db', 'windows')).toBe(true)
      expect(ignoreHiddenFiles('Desktop.ini', 'windows')).toBe(true)
    })
  })

  describe('filterFileEntries', () => {
    it('should filter out hidden files', async () => {
      const entries = [
        { name: 'normal.txt' },
        { name: '.hidden' },
        { name: 'Thumbs.db' },
      ]
      const filtered = await filterFileEntries(entries, 'windows')
      expect(filtered).toEqual([{ name: 'normal.txt' }])
    })
  })

  describe('getTabType', () => {
    it('should detect image files', () => {
      expect(getTabType('test.jpg')).toBe(TabType.Image)
      expect(getTabType('test.png')).toBe(TabType.Image)
    })

    it('should detect markdown files', () => {
      expect(getTabType('test.md')).toBe(TabType.Markdown)
      expect(getTabType('test.markdown')).toBe(TabType.Markdown)
    })

    it('should detect PDF files', () => {
      expect(getTabType('test.pdf')).toBe(TabType.PDF)
    })

    it('should return unknown for unsupported types', () => {
      expect(getTabType('test.txt')).toBe(TabType.Unknown)
    })
  })

  describe('enableEditTab', () => {
    it('should enable edit for markdown and unknown types', () => {
      expect(enableEditTab(TabType.Markdown)).toBe(true)
      expect(enableEditTab(TabType.Unknown)).toBe(true)
    })

    it('should disable edit for other types', () => {
      expect(enableEditTab(TabType.Image)).toBe(false)
      expect(enableEditTab(TabType.PDF)).toBe(false)
    })
  })

  describe('calculateDataLength', () => {
    it('should calculate string length', () => {
      expect(calculateDataLength('test')).toBe(4)
    })

    it('should calculate ArrayBuffer length', () => {
      const buffer = new ArrayBuffer(8)
      expect(calculateDataLength(buffer)).toBe(8)
    })

    it('should throw for invalid types', () => {
      expect(() => calculateDataLength(123 as any)).toThrow()
    })
  })
})