import hotkeys from 'hotkeys-js'

export interface HotKey {
  id?: string,
  action?: string | (() => void),
  shortcut?: string,
}

function convertAcceleratorToHotkeys(accelerator: string): string {
  const parts = accelerator.toLowerCase().split('+')

  const modMap: Record<string, string[]> = {
    'commandorcontrol': ['command', 'ctrl'],
    'cmdorctrl': ['command', 'ctrl'], // 支持另一种写法
    'command': ['command'],
    'ctrl': ['ctrl'],
    'control': ['ctrl'],
    'shift': ['shift'],
    'alt': ['alt'],
    'option': ['alt'],
    'meta': ['command'], // meta 有时也指代 command
  }

  // 把所有组合键归类（modifier 和 key）
  const modifiers: string[] = []
  let key = ''

  for (const part of parts) {
    if (modMap[part]) {
      modifiers.push(part)
    } else {
      key = part
    }
  }

  // 生成所有组合（Command/Control 变体）
  const modVariants = modifiers.map(m => modMap[m] ?? [m])

  // 笛卡尔积生成所有组合情况
  function cartesianProduct(arr: string[][]): string[][] {
    return arr.reduce<string[][]>(
      (a, b) => a.flatMap(d => b.map(e => [...d, e])),
      [[]]
    )
  }

  const combos = cartesianProduct(modVariants).map(combo => [...combo, key])

  return combos.map(c => c.join('+')).join(', ')
}
/**
 * hotkeys-js 内部是直接在浏览器的 document 或 window 上注册事件监听器
 * @param hotkey 
 * @returns 
 */
export const addHotkey = (hotkey: HotKey) => {
  if (!hotkey.shortcut) return
  const shortcut = convertAcceleratorToHotkeys(hotkey.shortcut)
  hotkeys(shortcut, function (event) {
    event.preventDefault()
    if (typeof hotkey.action === 'function') {
      hotkey.action()
    }
  })
}

export const removeHotkey = (hotkey: HotKey) => {
  hotkeys.unbind(hotkey.shortcut)
}
// hotkeys默认：焦点在输入框时阻止快捷键事件
hotkeys.filter = () => true