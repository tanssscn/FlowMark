<script setup lang="ts">
import { CrepeBuilder } from '@milkdown/crepe/builder'
import { useEditor } from '@milkdown/vue'
import { Milkdown } from "@milkdown/vue";

const props = defineProps({
  value: {
    type: String,
    required: true,
  },
})
useEditor((root) => {
  const builder = new CrepeBuilder({
    root,
    defaultValue: props.value,
  })
  builder.setReadonly(true)
  return builder
})
</script>
<template>
  <Milkdown />
</template>