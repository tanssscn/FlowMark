<template>
  <div ref="editorRef" />
</template>

<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { useSettingsStore } from '@/stores/settingsStore.ts';
import {
  autocompletion,
  closeBrackets,
  closeBracketsKeymap,
  completionKeymap,
} from '@codemirror/autocomplete';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import {
  bracketMatching,
  defaultHighlightStyle,
  indentOnInput,
  syntaxHighlighting,
} from '@codemirror/language';
import { lintKeymap } from '@codemirror/lint';
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search';
import type { Extension } from '@codemirror/state';
import { Compartment, EditorState } from '@codemirror/state';
import {
  EditorView,
  ViewUpdate,
  crosshairCursor,
  dropCursor,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  keymap,
  rectangularSelection,
} from '@codemirror/view';
import { nord } from './one-dark';
import { useThrottleFn } from '@vueuse/core'

const basicSetup: Extension = [
  highlightActiveLineGutter(),
  highlightSpecialChars(),
  history(),
  dropCursor(),
  EditorState.allowMultipleSelections.of(true),
  indentOnInput(),
  syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
  bracketMatching(),
  closeBrackets(),
  autocompletion(),
  rectangularSelection(),
  crosshairCursor(),
  highlightActiveLine(),
  highlightSelectionMatches(),
  keymap.of([
    ...closeBracketsKeymap,
    ...defaultKeymap,
    ...searchKeymap,
    ...historyKeymap,
    ...completionKeymap,
    ...lintKeymap,
  ]),
];

const createCodeMirrorState = (
  dark: boolean, content: string) => {
  return EditorState.create({
    doc: content,
    extensions: [
      nord(dark),
      basicSetup,
      markdown(),
      EditorView.updateListener.of((viewUpdate) => {
        // if (viewUpdate.focusChanged)
          onCodeMirrorUpdate(viewUpdate);
      }),
    ],
  });
};

const emit = defineEmits(['updateMilkdown']);
const onCodeMirrorUpdate = useThrottleFn((viewUpdate: ViewUpdate) => {
  const getString = () => viewUpdate.state.doc.toString();
  emit('updateMilkdown', getString());
  viewUpdate.view.focus();
  requestAnimationFrame(() => {
    viewUpdate.view.focus();
  });
}, 200);
const settingsStore = useSettingsStore()

const props = defineProps<{
  content: string
}>();
const editorRef = ref<HTMLDivElement | null>(null);

let editor: EditorView | undefined = undefined;
onMounted(() => {
  editor = createView();
  watch(() => settingsStore.state.appearance.theme, (newTheme) => {
    const themeCompartment = new Compartment();
    editor?.dispatch({
      effects: themeCompartment.reconfigure(nord(newTheme === 'dark'))
    });
  })
});
const updateContent = (content: string) => {
  const currentSelection = editor?.state.selection;
  editor?.dispatch({
    changes: {
      from: 0,
      to: editor?.state.doc.length,
      insert: content
    },
    selection: currentSelection
  })
  focus()
}
const createView = () => {
  if (!editorRef.value) return;
  // 创建 Codemirror 视图
  return new EditorView({
    state: createCodeMirrorState(settingsStore.currentTheme === 'dark', props.content),
    parent: editorRef.value,
  });
}
const focus = () => {
  editor?.focus();
}
const getContent=()=>{
  editor?.state.doc.toString()
}
// 组件卸载时清理
onBeforeUnmount(() => {
  editor?.destroy();
});
defineExpose({
  updateContent,
  focus,
  getContent
})
</script>