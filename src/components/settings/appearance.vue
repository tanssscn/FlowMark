<script setup lang="ts">
import { themeManager } from '@/services/persistService'
import { useSettingsStore } from '@/stores/settingsStore'
import { useI18n } from 'vue-i18n'

const settingsStore = useSettingsStore()
const { t } = useI18n()

const themeOptions = [
  { value: 'system', label: t('settings.appearance.theme.system') },
  { value: 'light', label: t('settings.appearance.theme.light') },
  { value: 'dark', label: t('settings.appearance.theme.dark') }
]
const tabBehaviorOptions = [
  { value: 'new_tab', label: t('settings.appearance.tabBehavior.new') },
  { value: 'replace_tab', label: t('settings.appearance.tabBehavior.replace') }
]

const sizeChange = (newFontSize: number) => {
  document.documentElement.style.fontSize = `${newFontSize}px`
}
</script>

<template>
  <div class="space-y-6">
    <h3 class="text-xl !pb-3 text-gray-900 dark:text-gray-100">
      {{ t('settings.appearance.label') }}
    </h3>

    <el-form label-position="top" class="space-y-6">
      <el-form-item :label="t('settings.appearance.tabBehavior.label')">
        <el-select v-model="settingsStore.settings.appearance.tabBehavior" class="w-full max-w-xs">
          <el-option v-for="option in tabBehaviorOptions" :key="option.value" :label="option.label"
            :value="option.value" />
        </el-select>
      </el-form-item>
      <el-form-item :label="t('settings.appearance.theme.label')">
        <el-select v-model="settingsStore.settings.appearance.theme" class="w-full" @change="themeManager.applyTheme">
          <el-option v-for="option in themeOptions" :key="option.value" :label="option.label" :value="option.value" />
        </el-select>
      </el-form-item>
      <el-form-item :label="t('settings.appearance.fontSize.label')">
        <el-slider v-model="settingsStore.settings.appearance.fontSize" :min="12" :max="24" :step="1" show-input
          @change="sizeChange"
          :marks="{ 12: '12px', 14: '14px', 16: '16px', 18: '18px', 20: '20px', 22: '22px', 24: '24px' }" />
      </el-form-item>
      <el-form-item />
    </el-form>
  </div>
</template>