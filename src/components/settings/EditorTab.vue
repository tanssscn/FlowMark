<script setup lang="ts">
import { useSettingsStore } from '@/stores/settingsStore'
import { ViewMode } from '@/types/app-types'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'

const settingsStore = useSettingsStore()
const { settings } = storeToRefs(settingsStore)
const { t } = useI18n()


const fontFamilyOptions = [
  { value: "'Helvetica Neue', Arial, sans-serif", label: t('settings.editor.font.defaultFont') },
]

const viewModeOptions = [
  { value: ViewMode.WYSIWYG, label: t('settings.editor.defaultView.wysiwyg') },
  { value: ViewMode.SOURCE, label: t('settings.editor.defaultView.source') },
  { value: ViewMode.READONLY, label: t('settings.editor.defaultView.readonly') },
  { value: ViewMode.SPLIT, label: t('settings.editor.defaultView.split') }
]
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 10px;">
    <h3 class="mb-5 text-lg font-mediu">{{ t('settings.editor.label') }}</h3>


    <div class="mb-4 flex items-center">
      <label class="w-36 text-sm">{{ t('settings.editor.font.fontFamily') }}</label>
      <el-select v-model="settings.editor.font.fontFamily" class="max-w-[300px] flex-1">
        <el-option v-for="option in fontFamilyOptions" :key="option.value" :label="option.label"
          :value="option.value" />
      </el-select>
    </div>

    <div class="mb-4 flex items-center">
      <label class="w-36 text-sm">{{ t('settings.editor.font.lineHeight') }}</label>
      <div class="flex max-w-[300px] flex-1 items-center gap-4">
        <el-slider v-model="settings.editor.font.lineHeight" :min="1.2" :max="2.0" :step="0.1" class="flex-1" />
        <span class="min-w-10 text-right text-sm">{{ settings.editor.font.lineHeight.toFixed(1) }}</span>
      </div>
    </div>
    <div class="mb-4 flex items-center">
      <label class="w-36 text-sm">{{ t('settings.editor.defaultView.label') }}</label>
      <el-select v-model="settings.editor.defaultView" class="max-w-[300px] flex-1">
        <el-option v-for="option in viewModeOptions" :key="option.value" :label="option.label" :value="option.value" />
      </el-select>
    </div>
    <div class="space-y-4">
      <h4 class="text-md font-medium text-gray-800 dark:text-gray-200">
        {{ t('settings.editor.indent.label') }}
      </h4>
      <div class="mb-4 flex items-center">
        <label class="w-36 text-sm ">{{ t('settings.editor.indent.useTab') }}</label>
        <el-switch v-model="settings.editor.indent.useTab" />
      </div>

      <div class="mb-4 flex items-center">
        <label class="w-36 text-sm ">{{ t('settings.editor.indent.unit') }}</label>
        <el-input-number v-model="settings.editor.indent.indentUnit" :min="2" :max="8" :step="2"
          controls-position="right" class="w-32" />
      </div>
    </div>

  </div>
</template>