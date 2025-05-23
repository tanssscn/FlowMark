<!-- src/components/ShortcutRecorder.vue -->
<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useShortcutRecorder } from './composable/useShortcutRecorder'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  defaultShortcut: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: '双击录制快捷键'
  },
  allowEmpty: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:modelValue'])

const inputRef = ref()
const clickCount = ref(0)
let clickTimer: any = null

const {
  isRecording,
  currentKeys,
  startRecording,
  stopRecording,
  resetToDefault,
  clearShortcut,
  formatShortcut
} = useShortcutRecorder(inputRef)

// 初始化
if (props.defaultShortcut) {
  resetToDefault()
}

// 当前显示的快捷键
const displayShortcut = computed(() => {
  if (isRecording.value && currentKeys.value.length > 0) {
    return formatShortcut(currentKeys.value)
  }
  return props.modelValue || props.defaultShortcut || props.placeholder
})

// 处理点击事件 (双击进入编辑)
const handleClick = () => {
  clickCount.value++

  if (clickCount.value === 1) {
    clickTimer = setTimeout(() => {
      clickCount.value = 0
    }, 300)
  } else if (clickCount.value >= 2) {
    if (clickTimer) clearTimeout(clickTimer)
    clickCount.value = 0
    if (!isRecording.value) {
      startRecording()
    }
  }
}

// 失去焦点时取消
const handleBlur = () => {
  if (isRecording.value) {
    stopRecording(false)
  }
}

// 暴露方法给父组件
defineExpose({
  resetToDefault,
  clearShortcut
})
</script>

<template>
  <div class="relative min-w-[200px]">
    <el-input ref="inputRef" :model-value="displayShortcut" :placeholder="placeholder" :readonly="!isRecording" clearable
      @click="handleClick" @blur="handleBlur" @clear="clearShortcut">
    </el-input>
  </div>
</template>