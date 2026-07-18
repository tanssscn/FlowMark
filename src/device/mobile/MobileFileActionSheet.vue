<script setup lang="ts">
import { computed } from 'vue'
import type { FileEntry } from '@/types/appTypes'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  visible: boolean
  file: FileEntry | null
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  open: [file: FileEntry]
  copyPath: [file: FileEntry]
  share: [file: FileEntry]
  reveal: [file: FileEntry]
  remove: [file: FileEntry]
}>()

const { t } = useI18n()

const actions = computed(() => [
  { name: t('mobile.fileTree.openFile'), action: 'open', icon: 'description' },
  { name: t('mobile.fileTree.copyPath'), action: 'copyPath', icon: 'copy-o' },
  { name: t('mobile.fileTree.share'), action: 'share', icon: 'share-o' },
  { name: t('mobile.fileTree.revealInFinder'), action: 'reveal', icon: 'eye-o' },
  { name: t('mobile.fileTree.remove'), action: 'remove', icon: 'delete-o', color: '#ee0a24' },
])

const show = computed({
  get: () => props.visible,
  set: (v) => emit('update:visible', v),
})

function onSelect(action: { name: string; action: string }) {
  if (!props.file) return
  switch (action.action) {
    case 'open': emit('open', props.file); break
    case 'copyPath': emit('copyPath', props.file); break
    case 'share': emit('share', props.file); break
    case 'reveal': emit('reveal', props.file); break
    case 'remove': emit('remove', props.file); break
  }
}
</script>

<template>
  <van-action-sheet
    v-model:show="show"
    :actions="actions"
    :title="file?.name || ''"
    :cancel-text="t('common.cancel')"
    @select="onSelect"
    @cancel="show = false"
  />
</template>
