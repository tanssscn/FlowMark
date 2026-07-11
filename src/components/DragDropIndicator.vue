<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Upload, FolderOpened } from '@element-plus/icons-vue'
import { dragDropService } from '@/services/dragDrop/dragDropService'
import { useFile } from '@/composable/useFile'
import type { AppFileInfo } from '@/types/appTypes'
import { fileService } from '@/services/files/fileService'

const { t } = useI18n()
const isDragging = ref(false)
const { openRecentFile } = useFile()

const handleDragEnter = () => {
    isDragging.value = true
}

const handleDragLeave = () => {
    isDragging.value = false
}

const handleDrop = async (paths: string[]) => {
    isDragging.value = false
    for (const path of paths) {
        let fileInfo = {
            path,
            storageLocation: 'local'
        } as AppFileInfo
        fileInfo = await fileService.getStat(fileInfo)
        console.log('拖入的文件/文件夹路径:', fileInfo);
        try {
            await openRecentFile(fileInfo)
        } catch (error) {
            console.error('Failed to open dropped file:', path, error)
        }
    }
}

onMounted(() => {
    dragDropService.init(handleDrop, handleDragEnter, handleDragLeave)
})

onUnmounted(() => {
    dragDropService.destroy()
})
</script>

<template>
    <Transition name="fade">
        <div v-if="isDragging"
            class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div
                class="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl border-2 border-dashed border-blue-500 dark:border-blue-400 transition-all duration-300">
                <div class="flex flex-col items-center">
                    <div
                        class="w-20 h-20 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mb-4">
                        <Upload class="w-10 h-10 text-blue-500" />
                    </div>
                    <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-2">
                        {{ t('dragDrop.dropHere') }}
                    </h3>
                    <p class="text-gray-500 dark:text-gray-400 text-sm flex items-center">
                        <FolderOpened class="w-4 h-4 mr-2" />
                        {{ t('dragDrop.supportFiles') }}
                    </p>
                </div>
            </div>
        </div>
    </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
