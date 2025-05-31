import { LanguageDescription } from '@codemirror/language';
import { nanoid } from 'nanoid';

export const mermaidPreviewer = (language: string, content: string) => {
  language = language.toLowerCase()
  if (language === 'mermaid') {
    const container = document.createElement('div')
    const randomId = nanoid(5);
    const id = 'mermaid-pending' + randomId
    container.id = id;
    import("mermaid").then(m => {
      const mermaid = m.default;
      mermaid.initialize({ startOnLoad: false });
      mermaid.parse(content).then((parsed) => {
        mermaid.render(`mermaid-${randomId}`, content).then(({ svg }) => {
          const target = document.getElementById(id);
          if (target) {
            target.innerHTML = svg;
          } else {
            console.warn('mermaid container not found')
          }
        }).catch((err) => {
          const target = document.getElementById(id);
          if (target) {
            target.innerHTML = 'Error:' + err.message;
          } else {
            console.warn('mermaid container not found')
          }
        })
      }).catch((err) => {
        const target = document.getElementById(id);
        if (target) {
          target.innerHTML = 'Error:' + err.message;
        } else {
          console.warn('mermaid container not found')
        }
      })
    })
    return container
  }
  // 其他语言交给默认渲染（Crepe 来处理）
  return null
}

export const mermaidLanguageSupport = LanguageDescription.of({
  name: 'Mermaid',
  alias: ['flowchart', 'sequenceDiagram', 'classDiagram', 'stateDiagram', 'erDiagram', 'journey', 'gantt', 'pie', 'quadrantChart', 'requirementDiagram', 'gitGraph', 'C4Context', 'mindmap', 'timeline', 'zenuml'],
  load() {
    return import('codemirror-lang-mermaid').then((m) => m.mermaid())
  },
})


