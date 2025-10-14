// components/ThemedText.jsx
import React from "react";
import { Text } from "react-native";

/**
 * Props:
 * - font: 'manrope' | 'oleo'   (default 'manrope')
 * - weight (manrope): 'thin' | 'light' | 'regular' | 'medium' | 'semibold' | 'bold' | 'extrabold'
 * - weight (oleo): 'regular' | 'bold'
 * - variant (optional): 'h1'|'h2'|'h3'|'title'|'subtitle'|'body'|'caption'|'button'
 * - style, ...Text props
 */

const MANROPE = {
  thin: "Manrope-Thin",
  light: "Manrope-Light",
  regular: "Manrope-Regular",
  medium: "Manrope-Medium",
  semibold: "Manrope-SemiBold",
  bold: "Manrope-Bold",
  extrabold: "Manrope-ExtraBold",
};

const OLEO = {
  regular: "OleoScript-Regular",
  bold: "OleoScript-Bold",
};

// const VARIANT_STYLES = {
//   h1: { fontSize: 32, lineHeight: 38 },
//   h2: { fontSize: 28, lineHeight: 34 },
//   h3: { fontSize: 22, lineHeight: 28 },
//   title: { fontSize: 18, lineHeight: 24 },
//   subtitle: { fontSize: 16, lineHeight: 22 },
//   body: { fontSize: 14, lineHeight: 20 },
//   caption: { fontSize: 12, lineHeight: 16 },
//   button: { fontSize: 14, lineHeight: 18 },
// };

export default function ThemedText({
  children,
  font = "manrope",
  weight = "regular",
  variant = "body",
  style,
  ...rest
}) {
  const family =
    font === "oleo"
      ? OLEO[weight] || OLEO.regular
      : MANROPE[weight] || MANROPE.regular;

  // merge variant size with provided styles
  // const variantStyle = VARIANT_STYLES[variant] || null;

  return (
    <Text
      {...rest}
      style={[
        { fontFamily: family },
        // variantStyle,
        // ignore any incoming fontWeight so the custom family always wins
        Array.isArray(style)
          ? style.map((s) => s && { ...s, fontWeight: undefined })
          : style && { ...style, fontWeight: undefined },
      ]}
    >
      {children}
    </Text>
  );
}
