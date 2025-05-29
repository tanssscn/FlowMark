<script setup lang="ts">
import { useSettingsStore } from '@/stores/settingsStore'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { Warning } from '@element-plus/icons-vue'

const settingsStore = useSettingsStore()
const { settings } = storeToRefs(settingsStore)
const { t } = useI18n()
</script>

<template>
  <div class="space-y-6">
    <h3 class="text-xl !pb-3 text-gray-900 dark:text-gray-100">
      {{ t('settings.markdown.label') }}
    </h3>

    <el-form label-position="top" class="space-y-4">
      <!-- Extensions Section -->
      <div class="space-y-4">
        <h4 class="mb-2 text-base">
          {{ t('settings.markdown.extensions') }}
        </h4>

        <!-- <el-form-item>
          <div class="flex items-center">
            <el-switch v-model="settings.markdown.extends.enableMath" />
            <span class="ml-2 text-sm text-gray-600 dark:text-gray-400">
              {{ t('settings.markdown.enableMath.label') }}
            </span>
            <el-tooltip effect="dark" placement="top">
              <template #content>
                {{ t('notify.info.newTabEffect') }}
              </template>
              <el-icon class="ml-2" :size="14">
                <Warning />
              </el-icon>
            </el-tooltip>
          </div>
        </el-form-item> -->

        <el-form-item>
          <div class="flex items-center">
            <el-switch v-model="settings.markdown.extends.enableEmoji" />
            <span class="ml-2 text-sm text-gray-600 dark:text-gray-400">
              {{ t('settings.markdown.enableEmoji.label') }}
            </span>
          </div>
        </el-form-item>

        <!-- <el-form-item>
          <div class="flex items-center">
            <el-switch v-model="settings.markdown.extends.enableMermaid" />
            <span class="ml-2 text-sm text-gray-600 dark:text-gray-400">
              {{ t('settings.markdown.enableMermaid.label') }}
            </span>
          </div>
        </el-form-item> -->
      </div>

      <!-- TOC Section -->
      <div class="space-y-4">
        <h4 class="mb-2 text-base">
          {{ t('settings.markdown.toc.depth') }}
        </h4>

        <el-form-item>
          <el-select 
            v-model="settings.markdown.tocDepth" 
            multiple 
            class="w-full max-w-xs"
          >
            <el-option 
              v-for="depth in [1, 2, 3, 4, 5, 6]" 
              :key="depth" 
              :label="`H${depth}`" 
              :value="depth" 
            />
          </el-select>
        </el-form-item>
      </div>

      <!-- Code Block Section -->
      <!-- <div class="space-y-4">
        <h4 class="text-md font-medium text-gray-800 dark:text-gray-200">
          {{ t('settings.markdown.codeBlock.label') }}
        </h4>

        <el-form-item>
          <div class="flex items-center">
            <el-switch v-model="settings.markdown.codeBlock.syntaxHighlighting" />
            <span class="ml-2 text-sm text-gray-600 dark:text-gray-400">
              {{ t('settings.markdown.codeBlock.syntaxHighlighting') }}
            </span>
          </div>
        </el-form-item>

        <el-form-item>
          <div class="flex items-center">
            <el-switch v-model="settings.markdown.codeBlock.lineNumbers" />
            <span class="ml-2 text-sm text-gray-600 dark:text-gray-400">
              {{ t('settings.markdown.codeBlock.lineNumbers') }}
            </span>
          </div>
        </el-form-item>
      </div> -->
    </el-form>
  </div>
</template>