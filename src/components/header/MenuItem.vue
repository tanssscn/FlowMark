<template>
  <el-menu-item
    :index="actionKey"
    :disabled="enabled === false"
    @click="handleClick"
  >
    <div class="flex justify-between items-center w-full">
      <div class="flex items-center">
        <i v-if="icon" :class="icon" class="mr-1"></i>
        <span>{{ label }}</span>
      </div>
      <div class="flex items-center ml-8">
        <el-icon v-if="checked"><Check /></el-icon>
        <!-- <span v-if="shortcut" class="text-gray-400 text-xs">
          {{ shortcut }}
        </span> -->
      </div>
    </div>
  </el-menu-item>
</template>

<script setup>
import { computed } from 'vue'
import {Check} from '@element-plus/icons-vue'
const props = defineProps({
  id: { type: String, default: undefined },
  label: { type: String, required: true },
  action: { type: [String, Function], default: null },
  shortcut: { type: String, default: '' },
  enabled: { type: Boolean, default: undefined },
  checked: { type: Boolean, default: false },
  icon: { type: String, default: '' }
})

const actionKey = computed(() => 
  typeof props.id ? props.id : props.label
)

const handleClick = () => {
  if (typeof props.action === 'function') {
    props.action()
  }
}
</script>