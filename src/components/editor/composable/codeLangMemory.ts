// src/plugins/codeBlockMemory.ts
import { Plugin, PluginKey } from '@milkdown/prose/state'
import { $prose } from '@milkdown/utils'
import { Ctx } from '@milkdown/ctx';

// 插件状态类型
interface CodeBlockMemoryState {
  lastLanguage: string
}

// 插件唯一标识
export const codeBlockMemoryPluginKey = new PluginKey<CodeBlockMemoryState>('code-block-memory')

export const codeBlockMemory = $prose((ctx: Ctx) => {
  // 插件核心实现
  return new Plugin({
    key: codeBlockMemoryPluginKey,
    state: {
      init: () => ({ lastLanguage: 'text' }), // 默认语言
      apply: (tr, prev) => {
        // 高效检测代码块语言变更
        const meta = tr.getMeta(codeBlockMemoryPluginKey) as { language?: string } | undefined

        // 如果有直接的语言变更元数据
        if (meta?.language) {
          return { lastLanguage: meta.language }
        }

        // 否则检查事务中是否有代码块节点变更
        if (!tr.docChanged) return prev

        let newLanguage: string | undefined

        // 只扫描新增或修改的节点
        tr.mapping.maps.forEach((map) => {
          map.forEach((oldStart, oldEnd, newStart, newEnd) => {
            tr.doc.nodesBetween(newStart, newEnd, (node) => {
              if (node.type.name === 'code_block' && node.attrs.language) {
                newLanguage = node.attrs.language
                return false // 找到第一个就停止
              }
              return true
            })
          })
        })
        return newLanguage ? { lastLanguage: newLanguage } : prev
      }
    }
  })
})