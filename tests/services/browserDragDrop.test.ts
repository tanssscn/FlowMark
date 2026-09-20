import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { BrowserDragDrop } from '@/services/dragDrop/browserDragDrop'

type FakeEvent = {
  preventDefault: ReturnType<typeof vi.fn>
  dataTransfer: { types: string[]; files: Array<{ name: string; path?: string }> }
  relatedTarget: unknown
  clientX: number
  clientY: number
}

const mkEvent = (overrides: Partial<FakeEvent> = {}): FakeEvent => ({
  preventDefault: vi.fn(),
  dataTransfer: { types: ['Files'], files: [] },
  relatedTarget: null,
  clientX: 0,
  clientY: 0,
  ...overrides,
})

describe('BrowserDragDrop', () => {
  let service: BrowserDragDrop
  let dropHandler: ReturnType<typeof vi.fn>
  let enterHandler: ReturnType<typeof vi.fn>
  let leaveHandler: ReturnType<typeof vi.fn>

  beforeEach(() => {
    service = new BrowserDragDrop()
    dropHandler = vi.fn()
    enterHandler = vi.fn()
    leaveHandler = vi.fn()
    service.init(dropHandler, enterHandler, leaveHandler)
  })

  afterEach(() => {
    service.destroy()
    vi.clearAllMocks()
  })

  it('不应拦截页面内部发起的拖拽（文件树节点拖拽场景）', () => {
    // @ts-expect-error 访问内部事件处理函数
    service.handleDragStart()

    const event = mkEvent({
      dataTransfer: { types: ['text/plain'], files: [] },
      relatedTarget: document.body,
      clientX: 100,
      clientY: 100,
    })
    // @ts-expect-error 访问内部事件处理函数
    service.handleDragEnter(event)
    // @ts-expect-error 访问内部事件处理函数
    service.handleDragOver(event)

    expect(event.preventDefault).not.toHaveBeenCalled()
    expect(enterHandler).not.toHaveBeenCalled()
  })

  it('内部拖拽结束后恢复对外部文件拖入的识别', () => {
    // @ts-expect-error 访问内部事件处理函数
    service.handleDragStart()
    // @ts-expect-error 访问内部事件处理函数
    service.handleDragEnd()

    const event = mkEvent()
    // @ts-expect-error 访问内部事件处理函数
    service.handleDragEnter(event)

    expect(event.preventDefault).toHaveBeenCalled()
    expect(enterHandler).toHaveBeenCalled()
  })

  it('外部文件拖入时应阻止默认行为并显示拖放指示', () => {
    // dragenter/dragover 阶段浏览器可能不提供 files 列表，仅通过 types 判断
    const enter = mkEvent()
    // @ts-expect-error 访问内部事件处理函数
    service.handleDragEnter(enter)
    const over = mkEvent()
    // @ts-expect-error 访问内部事件处理函数
    service.handleDragOver(over)

    expect(enter.preventDefault).toHaveBeenCalled()
    expect(over.preventDefault).toHaveBeenCalled()
    // dragenter 与 dragover 都会刷新指示层状态，重复置为可见不会造成额外渲染
    expect(enterHandler).toHaveBeenCalledTimes(2)
  })

  it('仅在拖拽离开文档窗口时触发 leave 回调，避免指示层闪烁', () => {
    // 文档内元素间移动：relatedTarget 非空
    const inner = mkEvent({
      relatedTarget: document.createElement('div'),
      clientX: 200,
      clientY: 200,
    })
    // @ts-expect-error 访问内部事件处理函数
    service.handleDragLeave(inner)
    expect(leaveHandler).not.toHaveBeenCalled()

    // 离开窗口
    const outer = mkEvent({ relatedTarget: null, clientX: 0, clientY: 0 })
    // @ts-expect-error 访问内部事件处理函数
    service.handleDragLeave(outer)
    expect(leaveHandler).toHaveBeenCalledTimes(1)
  })

  it('外部文件 drop 时提取文件路径并触发 drop 回调', () => {
    const event = mkEvent({
      clientX: 300,
      clientY: 300,
      dataTransfer: {
        types: ['Files'],
        files: [{ name: 'README.md' }, { name: 'notes.md', path: '/tmp/notes.md' }],
      },
    })
    // @ts-expect-error 访问内部事件处理函数
    service.handleDrop(event)

    expect(event.preventDefault).toHaveBeenCalled()
    // 浏览器环境拿不到绝对路径时退化为文件名；部分运行时提供 path 时优先使用
    expect(dropHandler).toHaveBeenCalledWith(['README.md', '/tmp/notes.md'])
    expect(leaveHandler).not.toHaveBeenCalled()
  })

  it('内部拖拽的 drop 事件不被拦截', () => {
    // @ts-expect-error 访问内部事件处理函数
    service.handleDragStart()
    const event = mkEvent({
      dataTransfer: { types: ['text/plain'], files: [] },
    })
    // @ts-expect-error 访问内部事件处理函数
    service.handleDrop(event)

    expect(event.preventDefault).not.toHaveBeenCalled()
    expect(dropHandler).not.toHaveBeenCalled()
  })

  it('destroy 后内部拖拽状态被重置', () => {
    // @ts-expect-error 访问内部事件处理函数
    service.handleDragStart()
    service.destroy()

    const fresh = new BrowserDragDrop()
    const drop = vi.fn()
    fresh.init(drop)
    const event = mkEvent({
      dataTransfer: { types: ['Files'], files: [{ name: 'a.md' }] },
    })
    // @ts-expect-error 访问内部事件处理函数
    fresh.handleDrop(event)

    expect(drop).toHaveBeenCalledWith(['a.md'])
    fresh.destroy()
  })

  describe('拖拽意外结束时收起指示层（看门狗）', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('按 ESC 取消拖拽后不再有 dragover，超时应收起指示层', () => {
      // @ts-expect-error 访问内部事件处理函数
      service.handleDragEnter(mkEvent())

      expect(leaveHandler).not.toHaveBeenCalled()
      vi.advanceTimersByTime(900)
      expect(leaveHandler).toHaveBeenCalledTimes(1)
    })

    it('持续收到 dragover 时不应误收起指示层', () => {
      for (let i = 0; i < 5; i++) {
        // @ts-expect-error 访问内部事件处理函数
        service.handleDragOver(mkEvent())
        vi.advanceTimersByTime(400)
      }

      expect(leaveHandler).not.toHaveBeenCalled()
    })

    it('drop 后应清除看门狗，不再触发 leave 回调', () => {
      const event = mkEvent({
        dataTransfer: { types: ['Files'], files: [{ name: 'a.md' }] },
      })
      // @ts-expect-error 访问内部事件处理函数
      service.handleDragEnter(mkEvent())
      // @ts-expect-error 访问内部事件处理函数
      service.handleDrop(event)

      vi.advanceTimersByTime(900)
      expect(leaveHandler).not.toHaveBeenCalled()
    })

    it('拖拽离开窗口时立即收起指示层并清除看门狗', () => {
      // @ts-expect-error 访问内部事件处理函数
      service.handleDragEnter(mkEvent())
      // @ts-expect-error 访问内部事件处理函数
      service.handleDragLeave(mkEvent({ relatedTarget: null, clientX: 0, clientY: 0 }))

      expect(leaveHandler).toHaveBeenCalledTimes(1)
      vi.advanceTimersByTime(900)
      expect(leaveHandler).toHaveBeenCalledTimes(1)
    })

    it('destroy 后看门狗应停止', () => {
      // @ts-expect-error 访问内部事件处理函数
      service.handleDragEnter(mkEvent())
      service.destroy()

      vi.advanceTimersByTime(900)
      expect(leaveHandler).not.toHaveBeenCalled()
    })
  })
})
