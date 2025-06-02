import { $prose } from '@milkdown/utils';
import { Plugin, PluginKey } from '@milkdown/prose/state';
import { Decoration, DecorationSet } from '@milkdown/prose/view';
import { Ctx } from '@milkdown/ctx';
import { Transaction, EditorState } from '@milkdown/prose/state';
import { FindOptions } from '../../../types';
import type { Node } from '@milkdown/prose/model'
import { createRegexMatcher, createTextMatcher, mergeSlash } from './searchMatcher';

interface MatchPosition {
  from: number;
  to: number;
}

interface SearchPluginState {
  decorations: DecorationSet;
  searchTerm: string;
  currentIndex: number;
  matches: MatchPosition[];
  initialized: boolean;
  options: FindOptions
}

export const searchPluginKey = new PluginKey<SearchPluginState>('search');

export const searchPlugin = $prose((ctx: Ctx) => {
  return new Plugin({
    key: searchPluginKey,
    state: {
      init: (): SearchPluginState => ({
        decorations: DecorationSet.empty,
        searchTerm: '',
        currentIndex: -1,
        matches: [],
        initialized: false,
        options: {
          matchCase: false,
          wholeWord: false,
          regex: false
        }
      }),
      apply: (
        tr: Transaction,
        prev: SearchPluginState,
        oldState: EditorState,
        newState: EditorState
      ): SearchPluginState => {
        const searchMeta = tr.getMeta(searchPluginKey);

        // 如果没有搜索元数据，保持原状态
        if (!searchMeta) {
          // 文档变化时更新装饰器位置
          if (tr.docChanged && prev.initialized) {
            return updateDecorations(prev, newState);
          }
          return prev;
        }

        // 处理搜索操作
        if (searchMeta.action === 'search') {
          const { searchTerm, options } = searchMeta;
          const doc = newState.doc;

          if (!searchTerm) {
            return {
              decorations: DecorationSet.empty,
              searchTerm: '',
              currentIndex: -1,
              matches: [],
              initialized: false,
              options: prev.options
            };
          }

          return performSearch(doc, searchTerm, options);
        }

        // 处理导航操作
        if (searchMeta.action === 'navigate' && prev.initialized) {
          return navigateMatches(prev, newState, searchMeta.direction);
        }

        return prev;
      }
    },
    props: {
      decorations(state: EditorState) {
        return this.getState(state)?.decorations || DecorationSet.empty;
      }
    }
  });
});
// 执行搜索并创建装饰器
function performSearch(doc: Node, searchTerm: string, options: FindOptions) {
  const decorations: Decoration[] = [];
  const matches: MatchPosition[] = [];

  // 创建匹配函数
  const getMatches = options.regex
    ? createRegexMatcher(searchTerm, options)
    : createTextMatcher(searchTerm, options);

  doc.descendants((node, pos) => {
    if (node.isText) {
      // 处理特殊字符转义
      const content = mergeSlash(node.textContent);

      const newMatches = getMatches(content, pos);
      matches.push(...newMatches);

      newMatches.forEach(match => {
        decorations.push(Decoration.inline(
          match.from,
          match.to,
          { class: 'search-highlight' }
        ));
      });
    }
  });

  let currentIndex = -1;
  if (matches.length > 0) {
    currentIndex = 0;

    // 更新当前匹配项的装饰器
    const currentMatch = matches[currentIndex];
    decorations.push(Decoration.inline(
      currentMatch.from,
      currentMatch.to,
      { class: 'current-search-highlight' }
    ));
  }

  return {
    decorations: DecorationSet.create(doc, decorations),
    searchTerm,
    currentIndex,
    matches,
    initialized: true,
    options
  };
}
// 文档变化时更新装饰器位置
function updateDecorations(prev: SearchPluginState, state: EditorState) {
  const { searchTerm, options } = prev;
  if (!searchTerm) return prev;

  return performSearch(state.doc, searchTerm, options);
}

// 导航到下一个/上一个匹配项
function navigateMatches(prev: SearchPluginState, state: EditorState, direction: 'next' | 'prev') {
  const { matches, decorations: prevDecorations, options } = prev;
  let { currentIndex } = prev;
  const doc = state.doc;

  if (matches.length === 0) return prev;

  // 计算新索引
  const newIndex = direction === 'next'
    ? (currentIndex + 1) % matches.length
    : (currentIndex - 1 + matches.length) % matches.length;

  // 创建新的装饰器集合
  const newDecorations: Decoration[] = [];

  // 添加所有匹配项
  matches.forEach((match, index) => {
    newDecorations.push(Decoration.inline(
      match.from,
      match.to,
      { class: index === newIndex ? 'current-search-highlight' : 'search-highlight' }
    ));
  });

  // 滚动到当前匹配项
  const match = matches[newIndex];
  if (match) {
    setTimeout(() => {
      const view = stateToView(state);
      if (view) {
        view.dispatch(view.state.tr.scrollIntoView());
      }
    }, 0);
  }

  return {
    ...prev,
    decorations: DecorationSet.create(doc, newDecorations),
    currentIndex: newIndex,
    options
  };
}

// 从编辑器状态获取视图（辅助函数）
function stateToView(state: EditorState) {
  const view = (state as any).editorView;
  return view && view.dom && view.dom.parentNode ? view : null;
}