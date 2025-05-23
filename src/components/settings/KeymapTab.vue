<script setup lang="ts">
import { useSettingsStore } from '@/stores/settingsStore'
import { useI18n } from 'vue-i18n'
// import KeymapInput from './keymap/KeymapInput.vue'

const settingsStore = useSettingsStore()
const { t } = useI18n()
</script>

<template>
  <div class="space-y-6">
    <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">
      {{ t('settings.keymap.label') }}
    </h3>

    <div class="space-y-6">
      <el-form-item :label="t('settings.keymap.preset')">
          <el-button @click="settingsStore.resetKeymap">
            {{ t('settings.keymap.reset') }}
          </el-button>
      </el-form-item>

      <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
        <h4 class="text-md font-medium text-gray-800 dark:text-gray-200 mb-4">
          {{ t('settings.keymap.customize') }}
        </h4>

        <el-table :data="settingsStore.state.keymap.commands">
          <el-table-column 
            :label="t('settings.keymap.command.label')" 
            width="200" 
            prop="name"
          >
            <template #default="{ row }">
              <span>{{ t(`settings.keymap.command.${row.name}`) }}</span>
            </template>
          </el-table-column>
          <el-table-column :label="t('settings.keymap.shortcut')" prop="shortcut">
            <!-- <template #default="{ row }"> -->
              <!-- <KeymapInput 
                v-model="row.shortcut" 
                :placeholder="t('settings.keymap.clickToRecord')"
              /> -->
            <!-- </template> -->
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>