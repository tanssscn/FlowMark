<script setup lang="ts">
import { useSettingsStore } from '@/stores/settingsStore'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'

const settingsStore = useSettingsStore()
const { settings } = storeToRefs(settingsStore)
const { t } = useI18n()
</script>

<template>
  <div class="space-y-6">
    <h3 class="text-xl !pb-3 text-gray-900 dark:text-gray-100">
      {{ t('settings.file.label') }}
    </h3>
    <el-form label-width="auto">
      <!-- Save Settings -->
      <div>
        <h4 class="text-md font-medium text-gray-800 dark:text-gray-200">
          {{ t('settings.file.save.label') }}
        </h4>

        <el-form-item>
            <el-switch v-model="settings.file.save.autoSave" />
            <span class="ml-2 text-sm text-gray-600 dark:text-gray-400">
              {{ t('settings.file.save.autoSave.label') }}
            </span>
        </el-form-item>

        <el-form-item v-if="settings.file.save.autoSave" :label="t('settings.file.save.autoSave.interval')">
          <el-input-number v-model="settings.file.save.autoSaveInterval" :min="1" :max="60">
            <template #suffix>
              <span>s</span>
            </template>
          </el-input-number>
        </el-form-item>
      </div>
      <!-- history Settings -->
      <div>
        <h4 class="text-md font-medium text-gray-800 dark:text-gray-200">
          {{ t('settings.file.history.label') }}
        </h4>
        <el-form-item>
            <el-switch v-model="settings.file.history.autoSave" />
            <span class="ml-2 text-sm text-gray-600 dark:text-gray-400">
              {{ t('settings.file.history.autoSave.label') }}
            </span>
        </el-form-item>

        <el-form-item v-if="settings.file.history.autoSave" :label="t('settings.file.history.autoSave.interval')">
          <el-input-number v-model="settings.file.history.autoSaveInterval" :min="1" :max="60">
            <template #suffix>
              <span>min</span>
            </template>
          </el-input-number>
        </el-form-item>
        <el-form-item v-if="settings.file.history.autoSave" :label="t('settings.file.history.maxVersionNumber')">
          <el-input-number v-model="settings.file.history.maxNum" :min="1" :max="100"/>
        </el-form-item>
      </div>
      <!-- Image Settings -->
      <!-- <div class="space-y-4">
        <h4 class="text-md font-medium text-gray-800 dark:text-gray-200">
          {{ t('settings.file.image.label') }}
        </h4> -->

      <!-- <el-form-item :label="t('settings.file.image.maxWidth.label')">
          <el-input-number
            v-model="settings.file.image.maxWidth"
            :min="100"
            :max="2000"
            :step="50"
            controls-position="right"
          />
        </el-form-item> -->

      <!-- <el-form-item :label="t('settings.file.image.quality.label')">
            <el-slider
              v-model="settings.file.image.quality"
              :min="10"
              :max="100"
              :step="5"
              class="flex-1 max-w-xs"
            />
        </el-form-item> -->
      <!-- </div> -->
    </el-form>
  </div>
</template>