import { codeBlockConfig } from "@milkdown/kit/component/code-block"
import { mermaidLanguageSupport, mermaidPreviewer } from "./mermaidConfig"
import { Editor } from "@milkdown/kit/core"

export const mermaidPlugin = (
  editor: Editor
) => {
  editor.config((ctx) => {
    ctx.update(codeBlockConfig.key, (defaultConfig) => {
      defaultConfig.languages.push(mermaidLanguageSupport)
      const defaultRenderPreview = defaultConfig.renderPreview
      defaultConfig.renderPreview = (language: string, content: string): string | HTMLElement | null => {
        language = language.toLowerCase()
        if (language === 'mermaid') {
          return mermaidPreviewer(content)
        } else {
          return defaultRenderPreview(language, content)
        }
      }
      return defaultConfig
    })
  })
}