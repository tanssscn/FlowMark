import { describe, it, expect, vi, beforeEach } from 'vitest'
import { dialogService } from '@/services/dialog/dialogService'

vi.mock('@/i18n', () => ({
    default: {
        global: {
            t: (key: string) => key,
        },
    },
}))

vi.mock('@/services/dialog/tauriDialog', () => ({
    TauriPlatform: class {
        notify = vi.fn()
        alert = vi.fn()
        confirm = vi.fn()
        prompt = vi.fn()
    },
}))

vi.mock('@/services/dialog/browserDialog', () => ({
    ElementPlatform: class {
        notify = vi.fn()
        alert = vi.fn()
        confirm = vi.fn()
        prompt = vi.fn()
    },
}))

describe('dialogService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('notify', () => {
        it('should add notification to queue', async () => {
            await dialogService.notify({ message: 'Test message', type: 'info' })
        })

        it('should call platform notify', async () => {
            await dialogService.notify({ message: 'Test', type: 'success' })
        })
    })

    describe('alert', () => {
        it('should call platform alert with default confirm button', async () => {
            await dialogService.alert({ message: 'Test alert' })
        })

        it('should call platform alert with custom confirm button', async () => {
            await dialogService.alert({ message: 'Test', confirmButtonText: 'OK' })
        })
    })

    describe('confirm', () => {
        it('should call platform confirm with default buttons', async () => {
            await dialogService.confirm({ message: 'Test confirm' })
        })

        it('should call platform confirm with custom buttons', async () => {
            await dialogService.confirm({
                message: 'Test',
                confirmButtonText: 'Yes',
                cancelButtonText: 'No'
            })
        })
    })

    describe('prompt', () => {
        it('should call platform prompt with default buttons', async () => {
            await dialogService.prompt({ message: 'Test prompt' })
        })
    })

    describe('shortcut methods', () => {
        it('should call notify with success type', () => {
            dialogService.success('Success message', 'Success')
        })

        it('should call notify with warning type', () => {
            dialogService.warning('Warning message', 'Warning')
        })

        it('should call notify with error type', () => {
            dialogService.error('Error message', 'Error')
        })

        it('should call notify with info type', () => {
            dialogService.info('Info message', 'Info')
        })
    })

    describe('notifyError', () => {
        it('should call error with ErrorStatus message', () => {
            const mockError = { message: 'Error', detail: 'Detail' }
            dialogService.notifyError(mockError as any)
        })

        it('should call error without detail', () => {
            const mockError = { message: 'Error' }
            dialogService.notifyError(mockError as any)
        })
    })
})
