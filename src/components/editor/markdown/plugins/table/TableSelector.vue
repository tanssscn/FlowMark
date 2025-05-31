<template>
  <el-dialog width="300px">
    <div class="grid gap-0.5" :style="{ gridTemplateColumns: `repeat(${cols}, 20px)` }">
      <div v-for="(cell, index) in rows * cols" :key="index" class="w-5 h-5 border border-gray-300" :class="{
        'bg-blue-400': isHighlighted(index),
        'bg-white dark:bg-gray-800': !isHighlighted(index)
      }" @mouseenter="updateHover(index)" @click="confirm"></div>
    </div>
    <div class="mt-2 text-sm text-gray-600 dark:text-gray-300">
      {{ hoverRow }} 行 × {{ hoverCol }} 列
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { milkdownManager } from '@/services/milkdownManager'
import { ref } from 'vue'
const cols = 10
const rows = 10
const hoverRow = ref(0)
const hoverCol = ref(0)

const updateHover = (index: number) => {
  hoverRow.value = Math.floor(index / cols) + 1
  hoverCol.value = (index % cols) + 1
}

const isHighlighted = (index: number) => {
  const row = Math.floor(index / cols)
  const col = index % cols
  return row < hoverRow.value && col < hoverCol.value
}

const emit = defineEmits<{
  (e: 'close'): void
}>()

const confirm = () => {
  milkdownManager.insertTable(hoverRow.value, hoverCol.value)
  emit('close')
}
</script>