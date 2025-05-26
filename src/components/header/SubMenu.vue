<template>
  <el-sub-menu
    :index="props.id? props.id : label"
    :disabled="enabled === false" >
    <template #title>
      <span class="flex items-center">
        <i v-if="icon" :class="icon" class="mr-1"></i>
        {{ label }}
      </span>
    </template>
    
    <template v-for="item in submenu" :key="item.name">
      <SubMenu
        v-if="item.submenu"
        :id="item.id"
        :label="item.name"
        :submenu="item.submenu"
        :enabled="item.enabled"
        :icon="item.icon"
      />
      <MenuItem
        v-else
        :id="item.id"
        :label="item.name"
        :action="item.action"
        :shortcut="item.shortcut"
        :enabled="item.enabled"
        :checked="item.checked"
        :icon="item.icon"
      />
    </template>
  </el-sub-menu>
</template>

<script lang="ts" setup >
import { PropType } from 'vue';
import MenuItem from './MenuItem.vue'
import { MenuConfig } from './composable/menuConfig';
const props = defineProps({
  id: { type: String, default: undefined },
  label: { type: String, required: true },
  submenu: { type: Array as PropType<MenuConfig[]>, required: true },
  enabled: { type: Boolean, default: undefined },
  icon: { type: String, default: '' }
})
</script>