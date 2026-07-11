import { describe, it, expect, vi, beforeEach } from 'vitest'
import { addHotkey, type HotKey } from '@/utils/hotkeys'

vi.mock('hotkeys-js', () => ({
    default: vi.fn(),
    unbind: vi.fn(),
}))

import hotkeys from 'hotkeys-js'

describe('hotkeys', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('addHotkey', () => {
        it('should not register hotkey when shortcut is missing', () => {
            const hotkey: HotKey = { id: 'test', action: () => { } }
            addHotkey(hotkey)
            expect(hotkeys).not.toHaveBeenCalled()
        })

        it('should register hotkey with shortcut', () => {
            const mockAction = vi.fn()
            const hotkey: HotKey = { id: 'test', action: mockAction, shortcut: 'ctrl+a' }
            addHotkey(hotkey)
            expect(hotkeys).toHaveBeenCalledWith('ctrl+a', expect.any(Function))
        })

        it('should convert accelerator format to hotkeys format', () => {
            const hotkey: HotKey = { id: 'test', action: vi.fn(), shortcut: 'CommandOrControl+Shift+P' }
            addHotkey(hotkey)
            expect(hotkeys).toHaveBeenCalledWith('command+shift+p, ctrl+shift+p', expect.any(Function))
        })

        it('should handle cmdorctrl alias', () => {
            const hotkey: HotKey = { id: 'test', action: vi.fn(), shortcut: 'CmdOrCtrl+S' }
            addHotkey(hotkey)
            expect(hotkeys).toHaveBeenCalledWith('command+s, ctrl+s', expect.any(Function))
        })

        it('should handle single key shortcuts', () => {
            const hotkey: HotKey = { id: 'test', action: vi.fn(), shortcut: 'escape' }
            addHotkey(hotkey)
            expect(hotkeys).toHaveBeenCalledWith('escape', expect.any(Function))
        })

        it('should call action function when hotkey is triggered', () => {
            const mockAction = vi.fn()
            const hotkey: HotKey = { id: 'test', action: mockAction, shortcut: 'ctrl+s' }
            addHotkey(hotkey)

            const handler = (hotkeys as vi.Mock).mock.calls[0][1]
            const mockEvent = { preventDefault: vi.fn() }
            handler(mockEvent)

            expect(mockEvent.preventDefault).toHaveBeenCalled()
            expect(mockAction).toHaveBeenCalled()
        })

        it('should handle alt modifier', () => {
            const hotkey: HotKey = { id: 'test', action: vi.fn(), shortcut: 'alt+f' }
            addHotkey(hotkey)
            expect(hotkeys).toHaveBeenCalledWith('alt+f', expect.any(Function))
        })

        it('should handle option as alt', () => {
            const hotkey: HotKey = { id: 'test', action: vi.fn(), shortcut: 'option+f' }
            addHotkey(hotkey)
            expect(hotkeys).toHaveBeenCalledWith('alt+f', expect.any(Function))
        })

        it('should handle meta as command', () => {
            const hotkey: HotKey = { id: 'test', action: vi.fn(), shortcut: 'meta+f' }
            addHotkey(hotkey)
            expect(hotkeys).toHaveBeenCalledWith('command+f', expect.any(Function))
        })
    })
})
