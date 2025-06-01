import { $prose } from '@milkdown/utils';
import { Plugin, PluginKey } from '@milkdown/prose/state';
import { Decoration, DecorationSet } from '@milkdown/prose/view';
import { Ctx } from '@milkdown/ctx';
import { Transaction, EditorState } from '@milkdown/prose/state';
import { FindOptions } from '../../../types';

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
      ): SearchPluginState => {
        const searchMeta = tr.getMeta(searchPluginKey);

        if (!searchMeta) return prev;

        // 处理搜索操作
        if (searchMeta.action === 'search') {
          const { searchTerm, options } = searchMeta;
          console.log('search', searchTerm, options);
          const doc = tr.doc;

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

          const decorations: Decoration[] = [];
          const matches: { from: number, to: number }[] = [];

          // 创建匹配函数
          const getMatches = options.regex
            ? createRegexMatcher(searchTerm, options)
            : createTextMatcher(searchTerm, options);

          doc.descendants((node, pos) => {
            if (node.isText) {
              const content = node.textContent;
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
            currentIndex = matches.findIndex(match =>
              match.from >= (tr.selection?.from || 0)
            );
            if (currentIndex === -1) currentIndex = 0;

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
        // 处理导航操作
        if (searchMeta.action === 'navigate' && prev.initialized) {
          const { matches, decorations: prevDecorations, options } = prev;
          let { currentIndex } = prev;
          const direction = searchMeta.direction;
          const doc = tr.doc;

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

          return {
            ...prev,
            decorations: DecorationSet.create(doc, newDecorations),
            currentIndex: newIndex,
            options
          };
        }
        return prev;
      }
    },
    props: {
      decorations(state: EditorState) {
        const stateObj = this.getState(state);
        if (stateObj) {
          return stateObj.decorations;
        } else {
          // 提供一个默认值，或者根据具体业务逻辑处理 undefined 的情况
          return DecorationSet.empty;
        }
      }
    }
  });
});

// 创建文本匹配器（普通文本搜索）
function createTextMatcher(searchTerm: string, options: { matchCase: boolean, wholeWord: boolean }) {
  const term = options.matchCase ? searchTerm : searchTerm.toLowerCase();
  const wordBoundary = options.wholeWord ? '\\b' : '';

  return (content: string, pos: number) => {
    const matches: { from: number, to: number }[] = [];
    const text = options.matchCase ? content : content.toLowerCase();
    let index = 0;

    while (index < content.length) {
      const matchIndex = text.indexOf(term, index);
      if (matchIndex === -1) break;

      const from = pos + matchIndex;
      const to = from + term.length;

      // 检查是否全词匹配
      if (!options.wholeWord || isWholeWord(content, matchIndex, term.length)) {
        matches.push({ from, to });
      }

      index = matchIndex + term.length;
    }

    return matches;
  };
}

// 创建正则表达式匹配器
function createRegexMatcher(pattern: string, options: { matchCase: boolean }) {
  const flags = options.matchCase ? 'g' : 'gi';
  let regex: RegExp;

  try {
    regex = new RegExp(pattern, flags);
  } catch (e) {
    // 正则表达式无效时退回普通文本搜索
    return createTextMatcher(pattern, { matchCase: options.matchCase, wholeWord: false });
  }

  return (content: string, pos: number) => {
    const matches: { from: number, to: number }[] = [];
    let match;

    while ((match = regex.exec(content)) !== null) {
      matches.push({
        from: pos + match.index,
        to: pos + match.index + match[0].length
      });

      // 避免无限循环
      if (match.index === regex.lastIndex) {
        regex.lastIndex++;
      }
    }

    return matches;
  };
}

// 检查是否全词匹配
function isWholeWord(text: string, index: number, length: number) {
  const before = index > 0 ? text[index - 1] : '';
  const after = index + length < text.length ? text[index + length] : '';
  return !isWordChar(before) && !isWordChar(after);
}

function isWordChar(char: string) {
  return /\w/.test(char);
}