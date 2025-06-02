const ZERO_WIDTH_SPACE = '\u200B';
const asterisk = `${ZERO_WIDTH_SPACE}*`;
const asteriskHolder = `${ZERO_WIDTH_SPACE}＊`;
const underline = `${ZERO_WIDTH_SPACE}_`;
const underlineHolder = `${ZERO_WIDTH_SPACE}⎽`;

// 处理代码块中的特殊字符转义
export function mergeSlash(str: string) {
  return str
    .replaceAll(/\\\\\*/g, asterisk)
    .replaceAll(/\\\\_/g, underline)
    .replaceAll(asterisk, asteriskHolder)
    .replaceAll(underline, underlineHolder);
}

// 恢复特殊字符
export function restoreSpecialChars(str: string) {
  return str
    .replaceAll(asteriskHolder, asterisk)
    .replaceAll(underlineHolder, underline);
}

// 创建文本匹配器（普通文本搜索）
export function createTextMatcher(searchTerm: string, options: { matchCase: boolean, wholeWord: boolean }) {
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
export function createRegexMatcher(pattern: string, options: { matchCase: boolean }) {
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
export function isWholeWord(text: string, index: number, length: number) {
  const before = index > 0 ? text[index - 1] : '';
  const after = index + length < text.length ? text[index + length] : '';
  return !isWordChar(before) && !isWordChar(after);
}

export function isWordChar(char: string) {
  return /\w/.test(char);
}