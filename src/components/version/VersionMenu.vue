<script setup lang="ts">
import { formatDate } from '@/utils/formatUtil'
import { RefreshLeft, Notebook, Delete } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { VersionContextMenuState} from '@/components/version/useVersion'
import { versionService } from '@/services/versions/versionService';
import { VersionInfo } from '@/types/app-types.ts'
import { dialogService } from '@/services/dialog/dialogService'
import { computed, onUnmounted, ref } from 'vue'
import { onClickOutside } from '@vueuse/core'
const { t } = useI18n()

const props = defineProps<{
  contextMenu: VersionContextMenuState
}>()
const emit = defineEmits(['restoreVersion', 'close','compareWithCurrent','updateVersions'])
// 右键菜单操作
// 处理菜单项点击
const handleContextAction = async (index: string) => {
  const data = props.contextMenu.version
  if(data){
    const menuItem = menuItems.find(item => item.id === index)
    if (menuItem) {
      await menuItem.action(data)
    }
  }
  emit('close')
}

const deleteHandler = async (version: VersionInfo) => {
  try {
    dialogService.confirm({
      title: t('dialog.deleteVersion.title'),
      message: t('dialog.deleteVersion.message', { msg: `${version.message ?version.message.slice(0, 10) + '...' : ''}-${formatDate(version.createdAt, "YYYY-MM-DD HH:mm:ss").value}` }),
      type: 'warning'
    }).then( (res) => {
      if(!res)return
       versionService.deleteVersion(props.contextMenu.path?? '', version.id)
        .then((_versions: VersionInfo[]) => {
          emit('updateVersions', _versions)
        })
    })
  } catch (error) {
    console.error('删除版本失败:', error)
  }
}
// 定义菜单项配置
const menuItems = [
  {
    id: 'restore',
    label: computed(()=>t('sidebar.version.restore')),
    icon: RefreshLeft,
    action: (version: VersionInfo) => emit('restoreVersion',version)
  },
  {
    id: 'compare',
    label: computed(()=>t('sidebar.version.compare')),
    icon: Notebook,
    action: (version: VersionInfo) => emit('compareWithCurrent',version)
  },
  {
    id: 'delete',
    label: computed(()=>t('sidebar.version.delete')),
    icon: Delete,
    action: (version: VersionInfo) => deleteHandler(version)
  }
]
const fileTreeMenuRef = ref<HTMLElement | null>(null)
const marginLeft = computed(() => `${props.contextMenu.x}px`)
const marginTop = computed((): string => {
  let y = props.contextMenu.y
  if (fileTreeMenuRef.value) {
    // BUG：点击文件树右边缘会导致fileTreeMenuRef.value.offsetHeight为0
    const componentHeight = Math.max(fileTreeMenuRef.value.offsetHeight,200)
    if (props.contextMenu.y + componentHeight > window.innerHeight) {
      y = window.innerHeight - componentHeight
    }
  }
  return `${y}px`
})
// 监听菜单显示状态
onClickOutside(fileTreeMenuRef, event => emit('close'))

</script>
<template>
  <div class="file-tree-menu" ref="fileTreeMenuRef" v-show="contextMenu.visible">
    <div v-for="item in menuItems" :key="item.id">
      <el-button class="w-full justify-start!" text bg @click="handleContextAction(item.id)">
        <el-icon>
          <component :is="item.icon" />
        </el-icon>
        <span>{{ item.label }}</span>
      </el-button>
    </div>
  </div>
</template>
<style scoped>
/**
 append-to-body会影响css选择，scope更难选择到，
所以像dialog这种弹出层不用scope，直接写全局样式，自定class避免影响其他组件 
 */
.file-tree-menu {
  position: fixed;
  top: v-bind("marginTop");
  left: v-bind("marginLeft");
  z-index: 999;
}
</style>