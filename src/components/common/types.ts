import { Ref } from "vue"

export interface SplitPaneContext {
  containerRef: Ref<HTMLElement | null>
  panels: Ref<SplitPanelContext[]>
  registerPanel: (panel: SplitPanelContext) => void
  unregisterPanel: (panel: SplitPanelContext) => void
  updatePanelPositions: () => void
}

export interface SplitPanelContext {
  getWidth: () => number
  setWidth: (width: number) => void
  setPosition: (position: number) => void
  handleWidth: number
  minWidth?: number
  maxWidth?: number
  element: Ref<HTMLElement | null>
}