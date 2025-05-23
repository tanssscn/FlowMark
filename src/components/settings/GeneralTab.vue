<script setup lang="ts">
import { I18nSchema, setLanguage } from '@/i18n'
import { useSettingsStore } from '@/stores/settingsStore'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { rebuildMenu } from '../header/client/tauriMenu'
import { Language } from '@/types/app-settings'

const settingsStore = useSettingsStore()
const { settings } = storeToRefs(settingsStore)
const { t } = useI18n<[I18nSchema]>()
const updateLanguage = async (lang: Language) => {
  await setLanguage(lang)
  rebuildMenu()
}
const languageOptions = [
  { value: 'system', label: t('settings.general.language.system') },
  { value: 'zh-CN', label: '简体中文' },
  { value: 'en-US', label: 'English' }
]


const conflictResolutionOptions = [
  { value: 'ask', label: t('settings.general.conflictResolution.ask') },
  { value: 'overwrite', label: t('settings.general.conflictResolution.overwrite') },
  { value: 'keep_both', label: t('settings.general.conflictResolution.keep_both') }
]
</script>

<template>
  <div class="space-y-6">
    <h3 class="text-xl !pb-3 text-gray-900 dark:text-gray-100">
      {{ t('settings.general.label') }}
    </h3>

    <el-form label-position="top" class="space-y-6">
      <el-form-item :label="t('settings.general.language.label')">
        <el-select v-model="settings.general.language" class="w-full" @change="updateLanguage">
          <el-option v-for="option in languageOptions" :key="option.value" :label="option.label"
            :value="option.value" />
        </el-select>
      </el-form-item>

      <el-form-item :label="t('settings.general.conflictResolution.label')">
        <el-select v-model="settings.general.conflictResolution" class="w-full">
          <el-option v-for="option in conflictResolutionOptions" :key="option.value" :label="option.label"
            :value="option.value" />
        </el-select>
      </el-form-item>

      <el-form-item :label="t('settings.general.restoreSession.label')">
        <el-switch v-model="settings.general.restoreLastSession" />
      </el-form-item>
    </el-form>
  </div>
</template>