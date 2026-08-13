import MarkdownIt from "markdown-it";

import { findUnescapedDelimiter, markdownMath } from "./markdown-math";

const markdownBlockParser = new MarkdownIt().use(markdownMath);
const DISPLAY_MATH_START =
  /^(?:(?: {0,3}>[ \t]?)|(?: {0,3}(?:[-+*]|\d{1,9}[.)])[ \t]+))* {0,3}(\$\$|\\\[)/;

function getStreamedMathClosing(line: string): "$$" | "\\]" | null {
  const match = DISPLAY_MATH_START.exec(line);
  if (!match) {
    return null;
  }

  const closing = match[1] === "$$" ? "$$" : "\\]";
  return findUnescapedDelimiter(line.slice(match[0].length), closing) === -1 ? closing : null;
}

export function splitMarkdownBlocks(text: string): string[] {
  if (text.length === 0) {
    return [];
  }

  const blocks: string[] = [];
  let currentLines: string[] = [];
  let activeDisplayMathClosing: "$$" | "\\]" | null = null;
  let sawBlockSeparator = false;
  const lines = text.split("\n");
  const { structuralBlankLines, literalLines } = getMarkdownStructure(text, lines);

  for (const [index, line] of lines.entries()) {
    const isBlankLine = line.trim().length === 0;
    if (isBlankLine && (activeDisplayMathClosing || structuralBlankLines.has(index))) {
      currentLines.push(line);
      continue;
    }

    if (isBlankLine) {
      if (currentLines.length > 0) {
        sawBlockSeparator = true;
      }
      continue;
    }

    if (sawBlockSeparator) {
      blocks.push(currentLines.join("\n"));
      currentLines = [];
      sawBlockSeparator = false;
    }

    currentLines.push(line);

    if (literalLines.has(index)) {
      continue;
    }

    if (activeDisplayMathClosing) {
      if (findUnescapedDelimiter(line, activeDisplayMathClosing) !== -1) {
        activeDisplayMathClosing = null;
      }
      continue;
    }

    activeDisplayMathClosing = getStreamedMathClosing(line);
  }

  if (currentLines.length > 0) {
    blocks.push(currentLines.join("\n"));
  }

  return blocks.filter((block) => block.length > 0);
}

function getMarkdownStructure(
  text: string,
  lines: string[],
): { structuralBlankLines: Set<number>; literalLines: Set<number> } {
  const structuralBlankLines = new Set<number>();
  const literalLines = new Set<number>();
  for (const token of markdownBlockParser.parse(text, {})) {
    if (token.level !== 0 || !token.map) {
      continue;
    }
    const [start, end] = token.map;
    if (token.type === "fence") {
      for (let index = start; index < end; index++) {
        literalLines.add(index);
      }
    }
    for (let index = start; index < end - 1; index++) {
      if (lines[index]?.trim().length === 0) {
        structuralBlankLines.add(index);
      }
    }
  }
  return { structuralBlankLines, literalLines };
}
