import { useCallback, useEffect, useState } from "react";
import { MathView } from "@dawsonxiong/react-native-latex-renderer";
import { Text, View, type StyleProp, type TextStyle } from "react-native";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import { resolvePlainMarkdownTextStyle } from "./markdown-text-style";
import { MarkdownTextSpan } from "./markdown-text";

const ThemedMathView = withUnistyles(MathView, (theme) => ({
  color: theme.colors.foreground,
}));

export interface MathFormulaProps {
  expression: string;
  source: string;
  displayMode: boolean;
  textStyle?: StyleProp<TextStyle>;
}

export function MathFormula({ expression, source, displayMode, textStyle }: MathFormulaProps) {
  const [failed, setFailed] = useState(false);
  const resolvedStyle = resolvePlainMarkdownTextStyle(textStyle);
  const fontSize = typeof resolvedStyle.fontSize === "number" ? resolvedStyle.fontSize : undefined;
  const handleError = useCallback(() => setFailed(true), []);

  useEffect(() => setFailed(false), [expression]);

  if (failed) {
    if (displayMode) {
      return (
        <View>
          <Text selectable style={textStyle}>
            {source}
          </Text>
        </View>
      );
    }

    return <MarkdownTextSpan style={textStyle}>{source}</MarkdownTextSpan>;
  }

  return (
    <ThemedMathView
      math={displayMode ? `$$${expression}$$` : `$${expression}$`}
      fontSize={fontSize}
      onError={handleError}
      style={displayMode ? styles.display : styles.inline}
    />
  );
}

const styles = StyleSheet.create({
  display: {
    width: "100%",
  },
  inline: {
    flexShrink: 1,
  },
});
