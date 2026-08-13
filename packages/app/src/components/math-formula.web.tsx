import React, {
  useCallback,
  useMemo,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import { renderToString } from "katex";
import { StyleSheet, type StyleProp, type TextStyle } from "react-native";
const DISPLAY_STYLE: CSSProperties = {
  cursor: "pointer",
  display: "block",
  maxWidth: "100%",
  overflowX: "auto",
  overflowY: "hidden",
  padding: "0.25em 0",
};
const INLINE_STYLE: CSSProperties = {
  cursor: "pointer",
  display: "inline-block",
  maxWidth: "100%",
  fontSize: "0.9em",
  verticalAlign: "baseline",
};
const RAW_DISPLAY_STYLE: CSSProperties = {
  ...DISPLAY_STYLE,
  whiteSpace: "pre-wrap",
};

export interface MathFormulaProps {
  expression: string;
  source: string;
  displayMode: boolean;
  textStyle?: StyleProp<TextStyle>;
}

export function MathFormula({ expression, source, displayMode, textStyle }: MathFormulaProps) {
  const textColor = StyleSheet.flatten(textStyle)?.color;
  const [formulaStyle, rawStyle] = useMemo(() => {
    const formula: CSSProperties = {
      ...(displayMode ? DISPLAY_STYLE : INLINE_STYLE),
      ...(typeof textColor === "string" ? { color: textColor } : {}),
    };
    return [formula, displayMode ? { ...RAW_DISPLAY_STYLE, ...formula } : formula] as const;
  }, [displayMode, textColor]);
  const [showSource, setShowSource] = useState(false);
  const rendered = useMemo(() => {
    const compactExpression = displayMode
      ? expression
      : expression.replace(/^\\displaystyle\s*/, "");
    try {
      const html = renderToString(compactExpression, {
        displayMode,
        output: "mathml",
      });
      return { __html: html };
    } catch {
      return null;
    }
  }, [displayMode, expression]);

  const handleToggle = useCallback(() => {
    setShowSource((visible) => !visible);
  }, []);
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleToggle();
      }
    },
    [handleToggle],
  );

  if (!rendered || showSource) {
    return (
      <code
        aria-label={source}
        onClick={rendered ? handleToggle : undefined}
        onKeyDown={rendered ? handleKeyDown : undefined}
        role={rendered ? "button" : undefined}
        style={rawStyle}
        tabIndex={rendered ? 0 : undefined}
        title={rendered ? "Show rendered formula" : "KaTeX could not render this formula"}
      >
        {source}
      </code>
    );
  }

  return (
    <span
      aria-label={source}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      role="button"
      style={formulaStyle}
      tabIndex={0}
      title="Show LaTeX source"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: KaTeX emits sanitized markup with trust disabled.
      dangerouslySetInnerHTML={rendered}
    />
  );
}
