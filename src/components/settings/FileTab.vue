<script setup lang="ts">
import { useSettingsStore } from '@/stores/settingsStore'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { ImagePathTypeOptions, ExternImagePathOptions } from "@/types/appSettingsConst"
const settingsStore = useSettingsStore()
const { settings } = storeToRefs(settingsStore)
const { t } = useI18n()
</script>

<template>
  <div class="space-y-6">
    <h3 class="mb-5 text-lg">
      {{ t('settings.file.label') }}
    </h3>
    <el-form label-width="auto" label-position="left">
      <!-- Save Settings -->
      <div>
        <h4 class="mb-2 text-base">
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
        <h4 class="mb-2 text-base">
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
          <el-input-number v-model="settings.file.history.maxNum" :min="1" :max="100" />
        </el-form-item>
      </div>
      <!-- Image Settings -->
      <div>
        <h4 class="mb-2 text-base">
          {{ t('settings.file.image.label') }}
        </h4>
        <el-form-item :label="t('settings.file.image.imagePath')">
          <el-radio-group v-model="settings.file.image.imagePathTypeOptions">
            <el-radio :value="ImagePathTypeOptions.ABSOULUTE">{{ t('settings.file.image.absolute') }}</el-radio>
            <el-radio :value="ImagePathTypeOptions.RELATIVE">{{ t('settings.file.image.relative') }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="t('settings.file.image.externImagePath')">
          <el-radio-group v-model="settings.file.image.externImagePathOptions">
            <el-radio :value="ExternImagePathOptions.KEEP">{{ t('settings.file.image.keepPath') }}</el-radio>
            <el-radio :value="ExternImagePathOptions.TRANSFER">{{ t('settings.file.image.transfer') }}</el-radio>
          </el-radio-group>
        </el-form-item>
      </div>
    </el-form>
  </div>
</template>