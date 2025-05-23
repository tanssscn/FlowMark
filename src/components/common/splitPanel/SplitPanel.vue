<template>
  <div ref="containerRef" class="w-full h-full">
    <!-- 左侧面板 -->
    <div v-show="showLeft" :class="[
      `h-full transition-[width] duration-200 ${leftClass}`,
      {
        'absolute left-0 top-0 z-10': leftAbsolute,
        'relative': !leftAbsolute,
      }
    ]" :style="{
      width: showRight ? `${leftWidth}px` : '100%',
    }">
      <slot name="left" :width="leftWidth" :updateWidth="(w: number | string) => updateWidth('left', w)" />
    </div>

    <!-- 拖拽手柄 -->
    <div v-if="showLeft && showRight"
      class='h-full bg-gray-300 dark:bg-gray-700 cursor-col-resize hover:bg-primary transition-colors duration-200 fixed top-0 z-20'
      :style="{
        width: `${handleWidth}px`,
        left: fixedLeft,
      }" @mousedown.prevent="startDrag" />

    <!-- 右侧面板 -->
    <div v-show="showRight" :class="[
      `h-full transition-[width] duration-200 ${rightClass}`,
      {
        'absolute top-0 z-10': rightAbsolute,
        'relative': !rightAbsolute,
      }
    ]" :style="{
      left: showLeft ? `${leftWidth + handleWidth}px` : '0px',
      width: showLeft
        ? `calc(100% - ${leftWidth + handleWidth}px)`
        : '100%'
    }">
      <slot name="right" :width="rightWidthComputed" :updateWidth="(w: number | string) => updateWidth('right', w)" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import {useElementBounding, useEventListener, useThrottleFn } from '@vueuse/core'

const props = withDefaults(
  defineProps<{
    // 布局模式
    leftAbsolute?: boolean
    rightAbsolute?: boolean
    // 初始宽度（支持数字或字符串如"50%"）
    leftWidth?: number | string
    rightWidth?: number | string
    // 拖拽手柄宽度
    handleWidth?: number
    // 最小/最大宽度
    minLeftWidth?: number
    maxLeftWidth?: number
    minRightWidth?: number
    maxRightWidth?: number
    // 可见性
    showLeft?: boolean
    showRight?: boolean
    leftClass?: string
    rightClass?: string
  }>(),
  {
    leftAbsolute: false,
    rightAbsolute: false,
    leftWidth: '50%',
    rightWidth: 'auto',
    handleWidth: 2,
    minLeftWidth: 150,
    maxLeftWidth: 800,
    minRightWidth: 150,
    maxRightWidth: 800,
    showLeft: true,
    showRight: true
  }
)

const emit = defineEmits<{
  // 宽度更新事件（双向绑定）
  (e: 'update:leftWidth', width: number): void
  (e: 'update:rightWidth', width: number): void
  // 拖拽事件
  (e: 'drag-start'): void
  (e: 'drag-end', leftWidth: number, rightWidth: number): void
}>()

const containerRef = ref<HTMLElement | null>(null)
const isDragging = ref(false)
// 解析百分比宽度
const parsePercentage = (value: string, containerWidth: number) => {
  return (containerWidth * parseFloat(value)) / 100
}
// 左侧宽度（响应式变量）
const leftWidth = ref(
  typeof props.leftWidth === 'string'
    ? parsePercentage(props.leftWidth, containerRef.value?.offsetWidth || 0)
    : props.leftWidth
)

// 右侧宽度计算
const rightWidthComputed = computed(() => {
  if (!containerRef.value) return 0
  if (props.rightWidth !== 'auto') {
    return typeof props.rightWidth === 'string'
      ? parsePercentage(props.rightWidth, containerRef.value.offsetWidth)
      : props.rightWidth
  }
  return containerRef.value.offsetWidth - leftWidth.value - props.handleWidth
})

const fixedLeft = computed(() => {
  if (containerRef.value) {
    return `${leftWidth.value + containerRect.left.value}px`
  } else {
    return `${leftWidth.value}px`
  }
})
const containerRect = useElementBounding(containerRef)

// 更新宽度（供父组件调用）
const updateWidth = (side: 'left' | 'right', width: number | string) => {
  const containerWidth = containerRef.value?.offsetWidth || 0
  const pixelWidth = typeof width === 'string'
    ? parsePercentage(width, containerWidth)
    : width

  if (side === 'left') {
    const clamped = Math.max(props.minLeftWidth, Math.min(props.maxLeftWidth, pixelWidth))
    leftWidth.value = clamped
    emit('update:leftWidth', clamped)
  } else {
    const clamped = Math.max(props.minRightWidth, Math.min(props.maxRightWidth, pixelWidth))
    emit('update:rightWidth', clamped)
  }
}

// 开始拖拽
const startDrag = useThrottleFn((e: MouseEvent) => {
  e.preventDefault()
  isDragging.value = true
  emit('drag-start')

  const startX = e.clientX
  const startWidth = leftWidth.value
  const containerWidth = containerRef.value?.offsetWidth || 0

  const handleMove = (e: MouseEvent) => {
    const dx = e.clientX - startX
    let newWidth = startWidth + dx

    // 应用约束
    newWidth = Math.max(
      props.minLeftWidth,
      Math.min(
        props.maxLeftWidth,
        newWidth
      )
    )

    // 计算右侧最小宽度约束
    const rightMinWidth = containerWidth - newWidth - props.handleWidth
    if (rightMinWidth < props.minRightWidth) {
      newWidth = containerWidth - props.minRightWidth - props.handleWidth
    }

    leftWidth.value = newWidth
    emit('update:leftWidth', newWidth)
  }

  const stopMove = useEventListener(document, 'mousemove', handleMove)
  const stopUp = useEventListener(
    document,
    'mouseup',
    () => {
      stopMove()
      stopUp()
      isDragging.value = false
      emit('drag-end', leftWidth.value, rightWidthComputed.value)
    },
    { once: true }
  )
}, 16)

// 初始化时计算百分比宽度
onMounted(() => {
  if (typeof props.leftWidth === 'string') {
    leftWidth.value = parsePercentage(props.leftWidth, containerRef.value?.offsetWidth || 0)
  }
})
</script>