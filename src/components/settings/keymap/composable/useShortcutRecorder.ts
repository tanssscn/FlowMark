// src/composables/useShortcutRecorder.ts
import { ref, onUnmounted, nextTick, Ref } from 'vue'
import hotkeys from 'hotkeys-js'

export function useShortcutRecorder(inputRef?: Ref<any>) {
  const isRecording = ref(false)
  const currentKeys = ref<string[]>([])
  const defaultShortcut = ref('')
  const currentShortcut = ref('')
  const lastValidShortcut = ref('')

  // 开始录制
  const startRecording = async () => {
    if (isRecording.value) return
    
    isRecording.value = true
    currentKeys.value = []
    lastValidShortcut.value = currentShortcut.value
    hotkeys.unbind('*')
    
    await nextTick()
    if (inputRef?.value) {
      inputRef.value.select()
    }
    
    hotkeys('*', (event) => {
      event.preventDefault()
      event.stopPropagation()
      
      const keys:string[] = []
      if (event.ctrlKey) keys.push('ctrl')
      if (event.metaKey) keys.push('command')
      if (event.altKey) keys.push('alt')
      if (event.shiftKey) keys.push('shift')
      
      if (!['Control', 'Meta', 'Alt', 'Shift'].includes(event.key)) {
        keys.push(event.key.toLowerCase())
      }
      
      if (keys.length > 0) {
        currentKeys.value = keys
        if (validateShortcut(keys)) {
          setTimeout(() => {
            const formatted = formatShortcut(keys)
            currentShortcut.value = formatted
            emitUpdate(keys.join('+'), formatted)
            stopRecording()
          }, 100)
        }
      }
    })
  }

  // 停止录制
  const stopRecording = (success = true) => {
    if (!isRecording.value) return
    
    isRecording.value = false
    hotkeys.unbind('*')
    
    if (!success) {
      currentShortcut.value = lastValidShortcut.value
    }
    currentKeys.value = []
  }

  // 重置为默认快捷键
  const resetToDefault = () => {
    currentShortcut.value = defaultShortcut.value
    lastValidShortcut.value = defaultShortcut.value
    emitUpdate(defaultShortcut.value, defaultShortcut.value)
    stopRecording(false)
  }

  // 清空快捷键
  const clearShortcut = () => {
    currentShortcut.value = ''
    lastValidShortcut.value = ''
    emitUpdate('', '')
    stopRecording(false)
  }

  // 验证快捷键
  const validateShortcut = (keys: string[]) => {
    if (keys.length === 0) return false
    const hasModifier = keys.some(k => {
      ['ctrl', 'command', 'alt', 'shift'].includes(k)
    const hasNormalKey = keys.some(k => 
      !['ctrl', 'command', 'alt', 'shift'].includes(k))
    return hasModifier && hasNormalKey})
  }

  // 格式化快捷键显示
  const formatShortcut = (keys: string[]) => {
    const isMac = navigator.platform.toUpperCase().includes('MAC')
    return keys.map(k => {
      switch (k) {
        case 'command': return isMac ? '⌘' : 'Cmd'
        case 'ctrl': return 'Ctrl'
        case 'alt': return isMac ? '⌥' : 'Alt'
        case 'shift': return isMac ? '⇧' : 'Shift'
        default: return k.toUpperCase()
      }
    }).join(isMac ? '' : '+')
  }

  // 触发更新事件
  const emitUpdate = (raw: string, formatted: string) => {
    // 实际使用时通过组件触发事件
  }

  onUnmounted(() => {
    hotkeys.unbind('*')
  })

  return {
    isRecording,
    currentKeys,
    defaultShortcut,
    currentShortcut,
    startRecording,
    stopRecording,
    resetToDefault,
    clearShortcut,
    formatShortcut
  }
}